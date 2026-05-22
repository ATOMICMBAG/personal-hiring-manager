"use client";

import { useState, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import {
  Upload,
  File as FileIcon,
  Check,
  ExternalLink,
  Download,
  Trash2,
} from "lucide-react";

export function ApplicationDocuments() {
  const app = useAppStore((s) => s.selectedApplication);
  const uploadDocument = useAppStore((s) => s.uploadDocument);
  const deleteDocument = useAppStore((s) => s.deleteDocument);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!app) return;
      setUploading(true);
      await uploadDocument(app.id, file);
      setUploading(false);
      setUploaded(file.name);
      setTimeout(() => setUploaded(null), 2000);
    },
    [app, uploadDocument],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (!app) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const docUrl = (docId: string, download = false) =>
    `/api/applications/${app.id}/documents/${docId}${download ? "?download=1" : ""}`;

  const handleDelete = async (docId: string) => {
    await deleteDocument(app.id, docId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-[16px]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
          Dokumente
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-[4px] text-xs px-[8px] py-[4px] hover:bg-[#f5f5f5] rounded transition-colors"
        >
          <Upload size={13} strokeWidth={1.5} />
          Upload
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded p-[24px] text-center cursor-pointer transition-colors ${
          isDragOver ? "drag-over" : "border-[#e5e5e5] hover:bg-[#fafafa]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ?
          <div className="text-xs text-[#9ca3af] animate-pulse">
            Lade hoch...
          </div>
        : uploaded ?
          <div className="flex items-center justify-center gap-[8px] text-xs text-[#374151]">
            <Check size={14} strokeWidth={1.5} />
            {uploaded} hochgeladen
          </div>
        : <div className="text-xs text-[#9ca3af]">
            Drag & Drop oder Klick zum Hochladen
          </div>
        }
      </div>

      {/* Document list */}
      {app.documents.length === 0 ?
        <div className="text-xs text-[#9ca3af] py-[8px] text-center">
          Noch keine Dokumente
        </div>
      : <ul className="space-y-[2px]">
          {app.documents.map((doc) => {
            const isConfirming = confirmDeleteId === doc.id;
            return (
              <li
                key={doc.id}
                className="flex items-center gap-[8px] px-[12px] py-[8px] hover:bg-[#f5f5f5] rounded transition-colors group"
              >
                <FileIcon
                  size={14}
                  strokeWidth={1.5}
                  className="text-[#9ca3af] shrink-0"
                />
                <a
                  href={docUrl(doc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex-1 truncate hover:underline"
                  title={`${doc.filename} öffnen`}
                >
                  {doc.filename}
                </a>
                <span className="text-[10px] text-[#9ca3af] tabular-nums shrink-0">
                  {formatSize(doc.sizeBytes)}
                </span>

                {isConfirming ?
                  <div className="flex items-center gap-[6px] text-[10px]">
                    <span className="text-[#991b1b]">Löschen?</span>
                    <button
                      onClick={() => handleDelete(doc.id)}
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
                : <div className="flex items-center gap-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={docUrl(doc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-[4px] hover:bg-[#e5e7eb] rounded transition-colors"
                      title="Öffnen / Vorschau"
                    >
                      <ExternalLink
                        size={13}
                        strokeWidth={1.5}
                        className="text-[#6b7280]"
                      />
                    </a>
                    <a
                      href={docUrl(doc.id, true)}
                      download={doc.filename}
                      className="p-[4px] hover:bg-[#e5e7eb] rounded transition-colors"
                      title="Herunterladen"
                    >
                      <Download
                        size={13}
                        strokeWidth={1.5}
                        className="text-[#6b7280]"
                      />
                    </a>
                    <button
                      onClick={() => setConfirmDeleteId(doc.id)}
                      className="p-[4px] hover:bg-[#fee2e2] rounded transition-colors"
                      title="Löschen"
                    >
                      <Trash2
                        size={13}
                        strokeWidth={1.5}
                        className="text-[#9ca3af] hover:text-[#991b1b]"
                      />
                    </button>
                  </div>
                }
              </li>
            );
          })}
        </ul>
      }
    </div>
  );
}
