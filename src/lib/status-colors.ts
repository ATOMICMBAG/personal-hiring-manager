export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  "Bewerbung gesendet": {
    bg: "#fef3c7",
    text: "#92400e",
    dot: "#f59e0b",
    label: "Gesendet",
  },
  Empfangsbestätigung: {
    bg: "#dbeafe",
    text: "#1e40af",
    dot: "#3b82f6",
    label: "Bestätigt",
  },
  "In Bearbeitung": {
    bg: "#dbeafe",
    text: "#1e40af",
    dot: "#3b82f6",
    label: "In Bearb.",
  },
  "Antwort erwartet": {
    bg: "#fef3c7",
    text: "#92400e",
    dot: "#f59e0b",
    label: "Wartend",
  },
  "Interview geplant": {
    bg: "#dcfce7",
    text: "#166534",
    dot: "#22c55e",
    label: "Interview",
  },
  "Interview geführt": {
    bg: "#dcfce7",
    text: "#166534",
    dot: "#22c55e",
    label: "Interview",
  },
  "Angebot erhalten": {
    bg: "#dcfce7",
    text: "#166534",
    dot: "#22c55e",
    label: "Angebot",
  },
  Angenommen: {
    bg: "#dcfce7",
    text: "#166534",
    dot: "#22c55e",
    label: "Angenommen",
  },
  Absage: {
    bg: "#fee2e2",
    text: "#991b1b",
    dot: "#ef4444",
    label: "Absage",
  },
};

export const DEFAULT_STATUS_COLOR = {
  bg: "#f3f4f6",
  text: "#374151",
  dot: "#9ca3af",
  label: "Unbekannt",
};

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR;
}
