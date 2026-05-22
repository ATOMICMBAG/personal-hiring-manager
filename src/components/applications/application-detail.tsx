"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { getStatusColor } from "@/lib/status-colors";
import {
  Clock,
  FileText,
  StickyNote,
  MapPin,
  Mail,
  Building2,
  Trash2,
} from "lucide-react";
import { ApplicationTimeline } from "./application-timeline";
import { ApplicationDocuments } from "./application-documents";
import { ApplicationNotes } from "./application-notes";

export function ApplicationDetail() {
  const app = useAppStore((s) => s.selectedApplication);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const isLoading = useAppStore((s) => s.isLoading);
  const deleteApplication = useAppStore((s) => s.deleteApplication);

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!app) return null;

  const sc = getStatusColor(app.status);

  const handleDelete = async () => {
    await deleteApplication(app.id);
    setConfirmDelete(false);
  };

  const tabs = [
    { id: "timeline" as const, label: "Timeline", icon: Clock },
    { id: "documents" as const, label: "Dokumente", icon: FileText },
    { id: "notes" as const, label: "Notizen", icon: StickyNote },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Application Header */}
      <div className="border-b border-[#e5e5e5] shrink-0 text-[#455269] text-right p-[16px] flex flex-col items-end gap-[6px]">
        <h2 className="text-[15px] font-semibold">{app.company.name}</h2>

        <span className="flex items-center gap-[6px] text-[12px]">
          <Building2 size={11} strokeWidth={1.5} />
          {app.title}
        </span>

        {app.contactName && (
          <span className="flex items-center gap-[6px] text-[12px]">
            <MapPin size={11} strokeWidth={1.5} />
            {app.contactName}
          </span>
        )}

        {app.contactEmail && (
          <span className="flex items-center gap-[6px] text-[12px]">
            <Mail size={11} strokeWidth={1.5} />
            {app.contactEmail}
          </span>
        )}

        {app.jobLink && (
          <span className="flex items-center gap-[6px] text-[12px]">
            <MapPin size={11} strokeWidth={1.5} />
            {app.jobLink}
          </span>
        )}

        <span
          className="text-[11px] px-[10px] py-[3px] rounded-full whitespace-nowrap font-medium"
          style={{ backgroundColor: sc.bg, color: sc.text }}
        >
          {app.status}
        </span>

        {confirmDelete ?
          <div className="flex items-center gap-[8px] text-[10px]">
            <span className="text-[#991b1b]">Löschen?</span>
            <button
              onClick={handleDelete}
              className="px-[6px] py-[2px] bg-[#fee2e2] text-[#991b1b] rounded hover:bg-[#fecaca]"
            >
              Ja
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-[6px] py-[2px] border border-[#e5e5e5] rounded hover:bg-[#f5f5f5]"
            >
              Nein
            </button>
          </div>
        : <button
            onClick={() => setConfirmDelete(true)}
            className="p-[4px] hover:bg-[#fee2e2] rounded transition-colors"
            title="Bewerbung löschen"
          >
            <Trash2
              size={13}
              strokeWidth={1.5}
              className="text-[#9ca3af] hover:text-[#991b1b]"
            />
          </button>
        }
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5] shrink-0 gap-[12px] justify-end px-[16px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                isActive ?
                  "border-black text-black"
                : "border-transparent text-[#9ca3af] hover:text-[#374151]"
              }`}
            >
              <Icon size={13} strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading && (
          <div className="text-xs text-[#9ca3af] animate-pulse">Lade...</div>
        )}
        {!isLoading && activeTab === "timeline" && <ApplicationTimeline />}
        {!isLoading && activeTab === "documents" && <ApplicationDocuments />}
        {!isLoading && activeTab === "notes" && <ApplicationNotes />}
      </div>
    </div>
  );
}
