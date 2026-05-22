"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { getStatusColor } from "@/lib/status-colors";
import { computeApplicationMetrics, motivationDots } from "@/lib/metrics";
import { CollapsibleSection } from "./collapsible-section";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Download,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";

export function RightSidebar() {
  const selectedApp = useAppStore((s) => s.selectedApplication);
  const companies = useAppStore((s) => s.companies);
  const exportForAI = useAppStore((s) => s.exportForAI);

  const handleExportJSON = () => {
    if (!selectedApp) return;
    const json = exportForAI();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bewerbung-${selectedApp.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Live berechnete Metriken für die selektierte Bewerbung ---
  const metrics = useMemo(
    () =>
      selectedApp ? computeApplicationMetrics(selectedApp, companies) : null,
    [selectedApp, companies],
  );

  // --- Bewerbungsradar: Sammle alle Bewerbungen mit Zeiträumen ---

  const allTimelines = useMemo(() => {
    const result: {
      appId: string;
      companyName: string;
      title: string;
      status: string;
      firstDate: Date;
      lastDate: Date;
      dot: string;
    }[] = [];
    companies.forEach((c) => {
      c.applications.forEach((a) => {
        const events = a.timelineEvents;
        if (events.length === 0) return;
        const dates = events.map((e) => new Date(e.date));
        const first = new Date(Math.min(...dates.map((d) => d.getTime())));
        const last = new Date(Math.max(...dates.map((d) => d.getTime())));
        const sc = getStatusColor(a.status);
        result.push({
          appId: a.id,
          companyName: c.name,
          title: a.title,
          status: a.status,
          firstDate: first,
          lastDate: last,
          dot: sc.dot,
        });
      });
    });
    result.sort((a, b) => a.firstDate.getTime() - b.firstDate.getTime());
    return result;
  }, [companies]);

  // Calculate the global time range for the radar
  const radarRange = useMemo(() => {
    if (allTimelines.length === 0)
      return { min: new Date(), max: new Date(), span: 1 };
    const allDates = allTimelines.flatMap((t) => [
      t.firstDate.getTime(),
      t.lastDate.getTime(),
    ]);
    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    const span = Math.max(max.getTime() - min.getTime(), 86400000);
    return { min, max, span };
  }, [allTimelines]);

  const formatRadarDate = (d: Date) => {
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  };

  const getRadarPosition = (date: Date) => {
    return (
      ((date.getTime() - radarRange.min.getTime()) / radarRange.span) * 100
    );
  };

  const getRadarWidth = (first: Date, last: Date) => {
    return ((last.getTime() - first.getTime()) / radarRange.span) * 100;
  };

  // --- Bewerbungsradar Body (Inhalt der Sektion) ---
  const radarBody =
    allTimelines.length === 0 ?
      <div className="text-[13px] text-[#9ca3af] py-[8px] px-[8px]">
        Keine Daten
      </div>
    : <div className="space-y-[8px] px-[8px]">
        {/* Radar Chart */}
        <div className="relative pl-[40px] pr-[8px] py-[4px]">
          <div className="flex justify-between text-[8px] text-[#9ca3af] mb-[4px]">
            <span>{formatRadarDate(radarRange.min)}</span>
            <span>{formatRadarDate(radarRange.max)}</span>
          </div>
          <div className="space-y-[6px]">
            {allTimelines.map((t) => {
              const left = getRadarPosition(t.firstDate);
              const width = Math.max(getRadarWidth(t.firstDate, t.lastDate), 2);
              const isSelected = selectedApp?.id === t.appId;
              return (
                <div
                  key={t.appId}
                  className="relative h-[12px] group cursor-default"
                  title={`${t.companyName} – ${t.title} (${t.status})\n${formatRadarDate(t.firstDate)} → ${formatRadarDate(t.lastDate)}`}
                >
                  <div className="absolute inset-y-0 left-0 right-0 bg-[#f5f5f5] rounded-full" />
                  <div
                    className={`absolute inset-y-0 rounded-full transition-all ${
                      isSelected ? "ring-1 ring-black ring-offset-1" : ""
                    }`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: t.dot,
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  />
                  <div className="absolute -top-[20px] left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-[9px] px-[6px] py-[2px] rounded whitespace-nowrap z-10">
                    {t.companyName} – {t.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-[2px]">
          {allTimelines.map((t) => {
            const isSelected = selectedApp?.id === t.appId;
            return (
              <div
                key={t.appId}
                className={`flex items-center gap-[6px] text-[11px] px-[4px] py-[2px] rounded ${
                  isSelected ? "bg-[#f5f5f5] font-medium" : ""
                }`}
              >
                <span
                  className="w-[6px] h-[6px] rounded-full shrink-0"
                  style={{ backgroundColor: t.dot }}
                />
                <span className="truncate flex-1">
                  {t.companyName} – {t.title}
                </span>
                <span className="text-[#9ca3af] tabular-nums whitespace-nowrap">
                  {formatRadarDate(t.firstDate)}→{formatRadarDate(t.lastDate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>;

  // ===================== Übersicht (nichts selektiert) =====================
  if (!selectedApp) {
    return (
      <div className="p-[12px] space-y-[12px] text-[12px]">
        {/* Übersicht */}
        <div className="font-semibold text-[#374151] p-[8px] text-end">
          Übersicht
        </div>

        <CollapsibleSection
          id="right.radar.overview"
          title="Bewerbungsradar"
          align="end"
        >
          {radarBody}
        </CollapsibleSection>

        <CollapsibleSection id="right.tools.overview" title="Tools" align="end">
          <p className="text-[13px] text-[#9ca3af] px-[8px] py-[4px] text-end">
            Wähle eine Bewerbung für mehr Details.
          </p>
        </CollapsibleSection>
      </div>
    );
  }

  // ===================== Details (Bewerbung selektiert) =====================
  return (
    <div className="p-[12px] space-y-[12px] text-[12px]">
      <div className="font-semibold text-[#374151] p-[8px] text-end">
        Tools & Insights
      </div>

      <CollapsibleSection id="right.motivation" title="Motivation" align="end">
        {metrics && (
          <div className="px-[8px] space-y-[6px] text-end">
            {/* Motivation Score + Trend Pfeil */}
            <div className="inline-flex items-center gap-[6px]">
              <span className="text-[24px] font-semibold tabular-nums leading-none">
                {metrics.motivation}%
              </span>
              {metrics.trend === "up" ?
                <span
                  className="inline-flex items-center gap-[2px] text-[12px] text-[#15803d]"
                  title={`+${metrics.trendDelta} ggü. vor 14 Tagen`}
                >
                  <TrendingUp size={14} strokeWidth={1.75} />+
                  {metrics.trendDelta}
                </span>
              : metrics.trend === "down" ?
                <span
                  className="inline-flex items-center gap-[2px] text-[12px] text-[#991b1b]"
                  title={`${metrics.trendDelta} ggü. vor 14 Tagen`}
                >
                  <TrendingDown size={14} strokeWidth={1.75} />
                  {metrics.trendDelta}
                </span>
              : <span
                  className="inline-flex items-center gap-[2px] text-[12px] text-[#9ca3af]"
                  title="Stabil ggü. vor 14 Tagen"
                >
                  <Minus size={14} strokeWidth={1.75} />0
                </span>
              }
            </div>

            {/* Dots: 10 Stufen à 10 % */}
            <div className="font-mono text-[13px] tracking-[0.25em] text-[#374151]">
              {motivationDots(metrics.motivation)}
            </div>

            {/* ETA */}
            {metrics.etaDays != null && (
              <div
                className={`inline-flex items-center gap-[4px] text-[13px] ${
                  metrics.isOverdue ? "text-[#991b1b]" : "text-[#6b7280]"
                }`}
              >
                {metrics.isOverdue ?
                  <AlertTriangle size={12} strokeWidth={1.5} />
                : <Clock size={12} strokeWidth={1.5} />}
                {metrics.isOverdue ?
                  "Antwort überfällig"
                : metrics.etaDays === 0 ?
                  "Antwort heute erwartet"
                : `ETA: ~${metrics.etaDays} ${metrics.etaDays === 1 ? "Tag" : "Tage"}`
                }
              </div>
            )}

            {/* Letzter Kontakt */}
            {metrics.daysSinceLast != null && (
              <div className="text-[11px] text-[#9ca3af]">
                Letzter Kontakt vor{" "}
                {metrics.daysSinceLast === 0 ?
                  "heute"
                : metrics.daysSinceLast === 1 ?
                  "1 Tag"
                : `${metrics.daysSinceLast} Tagen`}
              </div>
            )}

            {/* Unternehmens-Reaktionsverhalten */}
            <div className="pt-[6px] mt-[6px] border-t border-[#e5e5e5] flex items-center justify-end gap-[6px]">
              <Zap
                size={12}
                strokeWidth={1.5}
                className={
                  metrics.companyResponsivenessLabel === "Schnell" ?
                    "text-[#15803d]"
                  : metrics.companyResponsivenessLabel === "Langsam" ?
                    "text-[#991b1b]"
                  : "text-[#9ca3af]"
                }
              />
              <span className="text-[11px] text-[#6b7280]">
                Unternehmen reagiert{" "}
                <span className="font-medium text-[#374151]">
                  {metrics.companyResponsivenessLabel.toLowerCase()}
                </span>
                {metrics.companyResponsivenessLabel !== "Unbekannt" && (
                  <span className="text-[#9ca3af]">
                    {" "}
                    ({metrics.companyResponsiveness}/100)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="right.radar.detail"
        title="Bewerbungsradar"
        align="end"
      >
        {radarBody}
      </CollapsibleSection>

      <CollapsibleSection id="right.export" title="Export" align="end">
        <div className="space-y-[2px] px-[8px]">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-[6px] w-full px-[8px] py-[4px] hover:bg-[#f5f5f5] rounded transition-colors"
          >
            <Download size={12} strokeWidth={1.5} className="text-[#9ca3af]" />
            Bewerbung als JSON
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="right.quicklinks"
        title="Schnellzugriffe"
        align="end"
      >
        <div className="space-y-[2px] px-[8px]">
          {[
            { label: "LinkedIn COM", url: "https://www.linkedin.com" },
            { label: "Indeed COM", url: "https://de.indeed.com" },
            { label: "Glassdoor COM", url: "https://www.glassdoor.com" },
            { label: "EURES EU", url: "https://europa.eu/" },
            {
              label: "Welcome to the Jungle COM",
              url: "https://global.welcometothejungle.com/",
            },
            { label: "CV-Library UK", url: "https://www.cv-library.co.uk/" },
            { label: "InfoJobs ES", url: "https://www.infojobs.net/" },
            { label: "Reed.co.uk UK", url: "https://www.reed.co.uk/" },
            { label: "Monster COM", url: "https://www.monster.com/" },
            { label: "Ziprecruiter US", url: "https://www.ziprecruiter.com" },
            { label: "Flexjobs COM", url: "https://www.flexjobs.com/" },
            {
              label: "AMS – Arbeitsmarktservice Österreich",
              url: "https://www.ams.at",
            },
            {
              label: "Arbeitsagentur Deutschland",
              url: "https://www.arbeitsagentur.de",
            },
            {
              label: "France Travail (ehem. Pôle Emploi) Frankreich",
              url: "https://www.francetravail.fr",
            },
            {
              label: "Le Forem (Wallonie) Belgien",
              url: "https://www.leforem.be ",
            },
            {
              label: "Actiris (Brüssel)  Belgien",
              url: "https://www.actiris.brussels",
            },
            { label: "VDAB (Flandern) Belgien", url: "https://www.vdab.be" },
            {
              label: "HZZ – Croatian Employment Service Kroatien",
              url: "https://www.hzz.hr",
            },
            {
              label: "Intreo – Public Employment Service Irland",
              url: "https://www.gov.ie/en/service/0dbe17-intreo",
            },
            {
              label:
                "ANPAL – National Agency for Active Labour Policies Italien",
              url: "https://www.anpal.gov.it",
            },
            {
              label: "NVA – State Employment Agency Lettland",
              url: "https://www.nva.gov.lv",
            },
            {
              label: "Užimtumo Tarnyba – Employment Service Litauen",
              url: "https://uzt.lt",
            },
            {
              label: "ADEM – Employment Agency Luxemburg",
              url: "https://adem.public.lu",
            },
            {
              label: "Jobsplus Malta",
              url: "https://jobsplus.gov.mt",
            },
            {
              label: "UWV Werkbedrijf Niederlande",
              url: "https://www.werk.nl",
            },
            {
              label: "Cyprus Public Employment Service Zypern",
              url: "https://www.pescps.dl.mlsi.gov.cy",
            },
            {
              label: "Labour Office of the Czech Republic Tschechien",
              url: "https://www.uradprace.cz",
            },
            {
              label: "Jobcenter / Work in Denmark Dänemark",
              url: "https://www.workindenmark.dk",
            },
            {
              label: "Estonian Unemployment Insurance Fund Estland",
              url: "https://www.tootukassa.ee",
            },
            {
              label: "TE‑Palvelut – Employment Services Finnland",
              url: "https://www.te-palvelut.fi",
            },
            {
              label: "DYPA – Public Employment Service Griechenland",
              url: "https://www.dypa.gov.gr",
            },
            {
              label: "National Employment Service Ungarn",
              url: "https://nfsz.munka.hu",
            },
            {
              label: "Praca.gov.pl – Public Employment Services Polen",
              url: "https://www.praca.gov.pl",
            },
            {
              label: "IEFP – Institute for Employment Portugal",
              url: "https://www.iefp.pt",
            },
            {
              label: "ANOFM – National Employment Agency Rumänien",
              url: "https://www.anofm.ro",
            },
            {
              label: "ÚPSVaR – Central Office of Labour Slowakei",
              url: "https://www.upsvr.gov.sk",
            },
            {
              label: "ZRSZ – Employment Service of Slovenia Spanien",
              url: "https://www.sepe.es",
            },
            {
              label: "Arbetsförmedlingen Schweden",
              url: "https://www.arbetsformedlingen.se",
            },
            {
              label: "Employment Agency Bulgaria Bulgarien",
              url: "https://www.az.government.bg",
            },
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[6px] px-[8px] py-[4px] hover:bg-[#f5f5f5] rounded transition-colors text-[#374151]"
            >
              <ExternalLink
                size={10}
                strokeWidth={1.5}
                className="text-[#9ca3af]"
              />
              {link.label}
            </a>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
