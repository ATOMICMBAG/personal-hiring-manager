"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Plus, Trash2, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ApplicationNotes() {
  const app = useAppStore((s) => s.selectedApplication);
  const saveNote = useAppStore((s) => s.saveNote);
  const deleteNote = useAppStore((s) => s.deleteNote);

  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!app) return null;

  const handleSave = async () => {
    if (!content.trim()) return;
    await saveNote(
      app.id,
      content,
      tags ? JSON.stringify(tags.split(",").map((t) => t.trim())) : undefined,
    );
    setContent("");
    setTags("");
    setEditing(false);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
    setConfirmDeleteId(null);
  };

  const toggleTags = (noteTags: string | null | undefined): string[] => {
    if (!noteTags) return [];
    try {
      return JSON.parse(noteTags);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-[16px]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
          Notizen
        </span>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-[4px] text-xs px-[8px] py-[4px] hover:bg-[#f5f5f5] rounded transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          Neue Notiz
        </button>
      </div>

      {/* New note editor */}
      {editing && (
        <div className="border border-[#e5e5e5] rounded p-3 space-y-2 bg-[#fafafa] animate-fade-in-up">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-[#e5e5e5] p-2 text-xs rounded min-h-[100px] font-mono bg-white focus:outline-none focus:border-black resize-y"
            placeholder="Markdown-Notiz …&#10;&#10;## Überschrift&#10;- Punkt 1&#10;- Punkt 2"
          />
          <div className="flex items-center gap-1.5">
            <Tag size={12} strokeWidth={1.5} className="text-[#9ca3af]" />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (kommagetrennt)"
              className="flex-1 border border-[#e5e5e5] px-2 py-1 text-xs rounded bg-white focus:outline-none focus:border-black"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#1a1a1a] text-white px-3 py-1.5 text-xs rounded hover:bg-black transition-colors"
            >
              Speichern
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {app.notes.length === 0 ?
        <div className="text-xs text-[#9ca3af] py-4 text-center">
          Noch keine Notizen
        </div>
      : <div className="space-y-3">
          {app.notes.map((note) => {
            const noteTags = toggleTags(note.tags);
            const isPreview = previewId === note.id;

            return (
              <div
                key={note.id}
                className="border border-[#e5e5e5] rounded overflow-hidden group"
              >
                {/* Note header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#fafafa] border-b border-[#e5e5e5]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#9ca3af] tabular-nums">
                      {new Date(note.createdAt).toLocaleDateString("de-DE")}
                    </span>
                    {noteTags.length > 0 && (
                      <div className="flex gap-1">
                        {noteTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 bg-[#e5e5e5] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {confirmDeleteId === note.id ?
                    <div className="flex items-center gap-[6px] text-[10px]">
                      <span className="text-[#991b1b]">Notiz entfernen?</span>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="px-[6px] py-[2px] bg-[#fee2e2] text-[#991b1b] rounded hover:bg-[#fecaca]"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-[6px] py-[2px] border border-[#e5e5e5] rounded hover:bg-white"
                      >
                        Nein
                      </button>
                    </div>
                  : <div className="flex items-center gap-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewId(isPreview ? null : note.id)}
                        className="text-[9px] px-[6px] py-[2px] hover:bg-[#e5e5e5] rounded transition-colors"
                      >
                        {isPreview ? "Quelltext" : "Vorschau"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(note.id)}
                        className="p-[4px] hover:bg-[#fee2e2] rounded transition-colors"
                        title="Notiz entfernen"
                      >
                        <Trash2
                          size={11}
                          strokeWidth={1.5}
                          className="text-[#9ca3af] hover:text-[#991b1b]"
                        />
                      </button>
                    </div>
                  }
                </div>

                {/* Note content */}
                <div className="p-3">
                  {isPreview ?
                    <div className="prose prose-sm max-w-none text-xs [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4">
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                  : <pre className="text-xs font-mono whitespace-pre-wrap text-[#374151]">
                      {note.content}
                    </pre>
                  }
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}
