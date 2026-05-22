/**
 * Personal Hiring Manager – Metric Engine
 * ───────────────────────────────────────
 * Dynamische Berechnung von Motivation, Trend und ETA für jede Bewerbung.
 *
 * Die ursprünglichen DB-Felder `application.motivation` und `application.etaDays`
 * waren statisch (Default 50) und reflektierten weder den tatsächlichen
 * Bewerbungsverlauf noch die Reaktionsfreude des Unternehmens. Die hier
 * berechneten Werte ersetzen sie in der UI.
 *
 * Kernidee:
 *  • Status der Bewerbung gibt eine Basisbewertung (z. B. "Interview geführt" > "Wartend").
 *  • Aktivität (mehr Events, Doks, Notizen) erhöht die Motivation moderat.
 *  • Langes Schweigen seit dem letzten Event senkt sie deutlich.
 *  • Schnelle Reaktion des Unternehmens (Bewerbung → erste Rückmeldung) gibt Bonus.
 *  • Trend vergleicht den heutigen Wert mit dem Wert vor 14 Tagen.
 *  • ETA = Resterwartung bis zum nächsten Event, abgeleitet aus dem typischen
 *    Reaktionsrhythmus des konkreten Unternehmens (Fallback: Status-typische SLA).
 */

import type {
  ApplicationWithRelations,
  CompanyWithCount,
  TimelineEventItem,
} from "./store";

// --- Status-Gewichte ---------------------------------------------------------

/**
 * Basismotivation pro Status. Höhere Werte = besser für den Bewerber.
 * Bewusst breit gefächert, damit Übergänge spürbar bleiben.
 */
const STATUS_WEIGHT: Record<string, number> = {
  Angenommen: 100,
  "Angebot erhalten": 92,
  "Interview geführt": 82,
  "Interview geplant": 76,
  "In Bearbeitung": 66,
  Empfangsbestätigung: 58,
  "Bewerbung gesendet": 50,
  "Antwort erwartet": 44,
  Wartend: 38,
  Absage: 5,
};

const DEFAULT_STATUS_WEIGHT = 50;

function statusWeight(status: string): number {
  return STATUS_WEIGHT[status] ?? DEFAULT_STATUS_WEIGHT;
}

// --- Status-typische SLA (Erwartungstage bis zur nächsten Aktion) ------------

const STATUS_SLA_DAYS: Record<string, number> = {
  "Bewerbung gesendet": 7,
  Empfangsbestätigung: 10,
  "In Bearbeitung": 14,
  "Interview geplant": 5,
  "Interview geführt": 7,
  "Angebot erhalten": 5,
  "Antwort erwartet": 10,
  Wartend: 14,
};

// --- Hilfsfunktionen ---------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / MS_PER_DAY;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function sortedByDate<T extends { date: string }>(events: T[]): T[] {
  return [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/** Mittlere Anzahl Tage zwischen zwei aufeinanderfolgenden Events. */
function avgGapDays<T extends { date: string }>(events: T[]): number | null {
  if (events.length < 2) return null;
  const sorted = sortedByDate(events);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(
      daysBetween(new Date(sorted[i - 1].date), new Date(sorted[i].date)),
    );
  }
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
}

// --- Penalty- und Bonus-Kurven ----------------------------------------------

/** Je länger das letzte Event her ist, desto stärker die Strafe. */
function recencyPenalty(daysSinceLast: number | null): number {
  if (daysSinceLast == null) return 0;
  if (daysSinceLast <= 7) return 0;
  if (daysSinceLast <= 14) return -5;
  if (daysSinceLast <= 30) return -15;
  if (daysSinceLast <= 60) return -25;
  return -35;
}

/** Mehr Aktivität (Events, Dokumente, Notizen) → kleiner Bonus. */
function activityBonus(
  eventCount: number,
  docCount: number,
  noteCount: number,
): number {
  let bonus = 0;
  if (eventCount >= 7) bonus += 10;
  else if (eventCount >= 4) bonus += 6;
  else if (eventCount >= 2) bonus += 3;
  bonus += Math.min(docCount, 3) * 2; // max +6
  bonus += Math.min(noteCount, 4); // max +4
  return bonus;
}

/**
 * Reaktionsgeschwindigkeit des Unternehmens:
 * Tage zwischen "Bewerbung gesendet" und dem nächsten Event.
 *  • < 3 Tage  → +10  (Top)
 *  • < 7 Tage  →  +5
 *  • <14 Tage  →   0
 *  • <30 Tage  →  -3
 *  • sonst     →  -8
 */
function reactionBonus(events: TimelineEventItem[]): number {
  if (events.length < 2) return 0;
  const sorted = sortedByDate(events);
  const start = sorted.find((e) => e.status === "Bewerbung gesendet");
  if (!start) return 0;
  const next = sorted.find(
    (e) => new Date(e.date).getTime() > new Date(start.date).getTime(),
  );
  if (!next) return 0;
  const d = daysBetween(new Date(start.date), new Date(next.date));

  if (d < 3) return 10;
  if (d < 7) return 5;
  if (d < 14) return 0;
  if (d < 30) return -3;
  return -8;
}

// --- Öffentliche API ---------------------------------------------------------

export interface ApplicationMetrics {
  motivation: number; // 0..100
  motivation14dAgo: number; // 0..100 (für Trendpfeil)
  trend: "up" | "down" | "flat";
  trendDelta: number; // motivation - motivation14dAgo
  /** Tage seit dem letzten Timeline-Event (null = noch keines). */
  daysSinceLast: number | null;
  /** Erwartete Tage bis zur nächsten Aktion. null = nicht berechenbar. */
  etaDays: number | null;
  /** True, wenn das Unternehmen die erwartete Antwortzeit überschritten hat. */
  isOverdue: boolean;
  /** 0..100 – wie reaktionsfreudig ist *dieses* Unternehmen über alle Bewerbungen? */
  companyResponsiveness: number;
  /** Menschlich lesbares Label dazu. */
  companyResponsivenessLabel: "Schnell" | "Mittel" | "Langsam" | "Unbekannt";
}

/**
 * Berechnet alle Metriken für eine Bewerbung. `companies` wird benötigt,
 * um die Reaktions-Charakteristik des Unternehmens zu ermitteln.
 */
export function computeApplicationMetrics(
  app: ApplicationWithRelations,
  companies: CompanyWithCount[],
  now: Date = new Date(),
): ApplicationMetrics {
  const events = app.timelineEvents;
  const sorted = sortedByDate(events) as TimelineEventItem[];
  const last = sorted[sorted.length - 1];
  const daysSinceLast = last ? daysBetween(new Date(last.date), now) : null;

  // 1) Heutige Motivation
  const motivation = motivationAt(app, sorted, now);

  // 2) Motivation vor 14 Tagen (simuliere historischen Zustand)
  const past = new Date(now.getTime() - 14 * MS_PER_DAY);
  const eventsAtPast = sorted.filter(
    (e) => new Date(e.date).getTime() <= past.getTime(),
  );
  const motivation14dAgo =
    eventsAtPast.length > 0 ?
      motivationAt(app, eventsAtPast, past)
    : motivation; // wenn vorher noch nichts da war: gleicher Wert

  const trendDelta = Math.round(motivation - motivation14dAgo);
  const trend: "up" | "down" | "flat" =
    trendDelta > 2 ? "up"
    : trendDelta < -2 ? "down"
    : "flat";

  // 3) Unternehmen-Responsiveness
  const company = companies.find((c) => c.id === app.companyId);
  const { score: companyResponsiveness, label: companyResponsivenessLabel } =
    computeCompanyResponsiveness(company);

  // 4) ETA
  const { etaDays, isOverdue } = computeEta({
    status: app.status,
    daysSinceLast,
    company,
  });

  return {
    motivation,
    motivation14dAgo,
    trend,
    trendDelta,
    daysSinceLast: daysSinceLast == null ? null : Math.round(daysSinceLast),
    etaDays,
    isOverdue,
    companyResponsiveness,
    companyResponsivenessLabel,
  };
}

/**
 * Innere Berechnung. Wird sowohl für "heute" als auch für "vor 14 Tagen"
 * verwendet (mit jeweils gefiltertem Event-Set).
 */
function motivationAt(
  app: ApplicationWithRelations,
  eventsUpTo: TimelineEventItem[],
  asOf: Date,
): number {
  const last = eventsUpTo[eventsUpTo.length - 1];
  const status = last?.status ?? app.status;
  const daysSinceLast = last ? daysBetween(new Date(last.date), asOf) : null;

  const base = statusWeight(status);
  const recency = recencyPenalty(daysSinceLast);
  const activity = activityBonus(
    eventsUpTo.length,
    app.documents.length,
    app.notes.length,
  );
  const reaction = reactionBonus(eventsUpTo);

  return Math.round(clamp(base + recency + activity + reaction, 0, 100));
}

// --- Company-Level: wie schnell reagiert dieses Unternehmen? -----------------

function computeCompanyResponsiveness(company: CompanyWithCount | undefined): {
  score: number;
  label: "Schnell" | "Mittel" | "Langsam" | "Unbekannt";
} {
  if (!company || company.applications.length === 0) {
    return { score: 50, label: "Unbekannt" };
  }

  const gaps: number[] = [];
  for (const a of company.applications) {
    const g = avgGapDays(a.timelineEvents);
    if (g != null) gaps.push(g);
  }
  if (gaps.length === 0) return { score: 50, label: "Unbekannt" };

  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  // Linear interpolieren: 0 Tage → 100, 30+ Tage → 0
  const score = Math.round(clamp(100 - (avg / 30) * 100, 0, 100));
  const label: "Schnell" | "Mittel" | "Langsam" =
    score >= 70 ? "Schnell"
    : score >= 40 ? "Mittel"
    : "Langsam";
  return { score, label };
}

// --- ETA --------------------------------------------------------------------

function computeEta(input: {
  status: string;
  daysSinceLast: number | null;
  company: CompanyWithCount | undefined;
}): { etaDays: number | null; isOverdue: boolean } {
  const { status, daysSinceLast, company } = input;

  // Wenn finaler Status erreicht: kein ETA mehr
  const FINAL = ["Angenommen", "Absage"];
  if (FINAL.includes(status)) {
    return { etaDays: null, isOverdue: false };
  }

  // Historische Durchschnitts-Antwortzeit dieses Unternehmens
  let companyAvg: number | null = null;
  if (company) {
    const gaps: number[] = [];
    for (const a of company.applications) {
      const g = avgGapDays(a.timelineEvents);
      if (g != null) gaps.push(g);
    }
    if (gaps.length > 0) {
      companyAvg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    }
  }

  const sla = STATUS_SLA_DAYS[status] ?? 14;
  // Erwartungswert für die Gesamtdauer bis zum nächsten Event
  const expectedTotal =
    companyAvg != null ? Math.round((companyAvg + sla) / 2) : sla;

  if (daysSinceLast == null) {
    return { etaDays: expectedTotal, isOverdue: false };
  }

  const remaining = Math.round(expectedTotal - daysSinceLast);
  return {
    etaDays: Math.max(0, remaining),
    isOverdue: remaining < 0,
  };
}

// --- Trend-Dots (10 Stufen, jede Stufe = 10 %) -------------------------------

export function motivationDots(motivation: number, length = 10): string {
  const filled = Math.round(clamp(motivation, 0, 100) / (100 / length));
  return Array.from({ length }, (_, i) => (i < filled ? "●" : "○")).join("");
}
