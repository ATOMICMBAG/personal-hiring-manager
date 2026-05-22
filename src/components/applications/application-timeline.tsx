"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Plus, Circle, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  "Bewerbung gesendet",
  "Empfangsbestätigung",
  "In Bearbeitung",
  "Interview geplant",
  "Interview geführt",
  "Angebot erhalten",
  "Angenommen",
  "Absage",
  "Antwort erwartet",
];

export function ApplicationTimeline() {
  const app = useAppStore((s) => s.selectedApplication);
  const addTimelineEvent = useAppStore((s) => s.addTimelineEvent);
  const deleteTimelineEvent = useAppStore((s) => s.deleteTimelineEvent);

  const [showAdd, setShowAdd] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!app) return null;

  const handleAdd = async () => {
    if (!newStatus) return;
    await addTimelineEvent(app.id, {
      status: newStatus,
      description: newDesc || undefined,
      date: newDate,
    });
    setShowAdd(false);
    setNewStatus("");
    setNewDesc("");
  };

  const handleDelete = async (eventId: string) => {
    await deleteTimelineEvent(app.id, eventId);
    setConfirmDeleteId(null);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-[16px]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
          Timeline
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-[4px] text-xs px-[8px] py-[4px] hover:bg-[#f5f5f5] rounded transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          Neuer Eintrag
        </button>
      </div>

      {/* Add new event form */}
      {showAdd && (
        <div className="border border-[#e5e5e5] rounded p-[12px] space-y-[8px] bg-[#fafafa] animate-fade-in-up">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full border border-[#e5e5e5] px-[8px] py-[6px] text-xs rounded bg-white focus:outline-none focus:border-black"
          >
            <option value="">Status wählen...</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Beschreibung (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full border border-[#e5e5e5] px-[8px] py-[6px] text-xs rounded bg-white focus:outline-none focus:border-black"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full border border-[#e5e5e5] px-[8px] py-[6px] text-xs rounded bg-white focus:outline-none focus:border-black"
          />
          <div className="flex gap-[8px]">
            <button
              onClick={handleAdd}
              className="flex-1 bg-[#1a1a1a] text-white px-[12px] py-[6px] text-xs rounded hover:bg-black transition-colors"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-[12px] py-[6px] text-xs border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {app.timelineEvents.length === 0 ?
        <div className="text-xs text-[#9ca3af] py-[16px] text-center">
          Noch keine Einträge
        </div>
      : <ul className="relative pl-[24px] border-l-2 border-[#e5e5e5] space-y-0 ml-[8px]">
          {app.timelineEvents.map((event, i) => {
            const isConfirming = confirmDeleteId === event.id;
            return (
              <li
                key={event.id}
                className="relative pb-[20px] animate-fade-in-up group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Dot */}
                <Circle
                  size={12}
                  strokeWidth={1.5}
                  className="absolute -left-[31px] top-0.5 fill-white text-[#374151]"
                />
                <div className="flex items-start justify-between gap-[8px]">
                  <div className="text-xs space-y-[2px] flex-1 min-w-0">
                    <span className="text-[#9ca3af] tabular-nums">
                      [{formatDate(event.date)}]
                    </span>
                    <span className="ml-[8px] font-medium">{event.status}</span>
                    {event.description && (
                      <p className="text-[#6b7280] mt-[2px]">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {isConfirming ?
                    <div className="flex items-center gap-[6px] text-[10px] shrink-0">
                      <span className="text-[#991b1b]">Entfernen?</span>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="px-[6px] py-[2px] bg-[#fee2e2] text-[#991b1b] rounded hover:bg-[#fecaca]"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-[6px] py-[2px] border border-[#e5e5e5] rounded hover:bg-[#f5f5f5]"
                      >
                        Nein
                      </button>
                    </div>
                  : <button
                      onClick={() => setConfirmDeleteId(event.id)}
                      className="p-[4px] rounded hover:bg-[#fee2e2] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      title="Eintrag entfernen"
                    >
                      <Trash2
                        size={12}
                        strokeWidth={1.5}
                        className="text-[#9ca3af] hover:text-[#991b1b]"
                      />
                    </button>
                  }
                </div>
              </li>
            );
          })}
        </ul>
      }
    </div>
  );
}
