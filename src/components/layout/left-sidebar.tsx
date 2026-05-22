"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getStatusColor } from "@/lib/status-colors";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

export function LeftSidebar() {
  const companies = useAppStore((s) => s.companies);
  const applications = useAppStore((s) => s.applications);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const statusFilter = useAppStore((s) => s.statusFilter);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setStatusFilter = useAppStore((s) => s.setStatusFilter);
  const loadApplication = useAppStore((s) => s.loadApplication);
  const deleteApplication = useAppStore((s) => s.deleteApplication);
  const updateCompany = useAppStore((s) => s.updateCompany);
  const deleteCompany = useAppStore((s) => s.deleteCompany);
  const setNewApplicationModalOpen = useAppStore(
    (s) => s.setNewApplicationModalOpen,
  );
  const selectedApp = useAppStore((s) => s.selectedApplication);

  const [collapsedCompanies, setCollapsedCompanies] = useState<
    Record<string, boolean>
  >({});
  const [contextMenu, setContextMenu] = useState<{
    type: "company" | "application";
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [editingCompany, setEditingCompany] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const toggleCompany = (id: string) => {
    setCollapsedCompanies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: "company" | "application",
    id: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDeleteApplication = async (id: string) => {
    await deleteApplication(id);
    closeContextMenu();
  };

  const handleDeleteCompany = async (id: string) => {
    await deleteCompany(id);
    closeContextMenu();
  };

  const handleStartEditCompany = (id: string, name: string) => {
    setEditingCompany({ id, name });
    closeContextMenu();
  };

  const handleSaveCompany = async () => {
    if (editingCompany && editingCompany.name.trim()) {
      await updateCompany(editingCompany.id, {
        name: editingCompany.name.trim(),
      });
    }
    setEditingCompany(null);
  };

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const statuses = useMemo(() => {
    const set = new Set(applications.map((a) => a.status));
    return Array.from(set).sort();
  }, [applications]);

  const getCompanyDominantStatus = (companyId: string) => {
    const compApps = applications.filter((a) => a.companyId === companyId);
    if (compApps.length === 0) return "Kein aktiver Status";
    const priority = [
      "Interview geplant",
      "Interview geführt",
      "Antwort erwartet",
      "In Bearbeitung",
      "Angebot erhalten",
      "Bewerbung gesendet",
      "Empfangsbestätigung",
      "Angenommen",
      "Absage",
    ];
    for (const p of priority) {
      if (compApps.some((a) => a.status === p)) return p;
    }
    return compApps[0]?.status ?? "Kein aktiver Status";
  };

  return (
    <div className="p-[12px] space-y-[16px] text-[12px]">
      {/* ---------- Status Filter ---------- */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full border border-[#e5e5e5] pl-[28px] pr-[8px] py-[6px] bg-white focus:outline-none focus:border-[#000] transition-colors text-[12px] text-[#46546d] font-medium text-right"
        >
          <option value="">Status</option>
          {statuses.map((s) => {
            const sc = getStatusColor(s);
            return (
              <option key={s} value={s}>
                {sc.label} ({s})
              </option>
            );
          })}
        </select>
      </div>

      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setNewApplicationModalOpen(true)}
          className="font-semibold uppercase tracking-wider text-[13px] text-[#46546d] text-right"
          title="Neue Bewerbung"
        >
          Unternehmen
        </button>
        <button
          onClick={() => setNewApplicationModalOpen(true)}
          className="ml-[4px] hover:bg-brand-lighter rounded transition-colors"
          title="Neue Bewerbung"
        >
          <Plus size={20} strokeWidth={1.8} color="#19741d" />
        </button>
      </div>

      {/* ---------- Aktive ---------- */}
      <div className="space-y-[4px]">
        {/* ---------- Search ---------- */}
        <div className="relative">
          <Search
            size={14}
            strokeWidth={1.5}
            className="absolute left-[4px] top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <input
            className="w-full border border-[#e5e5e5] pl-[28px] pr-[8px] py-[6px] rounded focus:outline-none focus:border-[#000] transition-colors text-[12px] text-[#19741d] font-medium text-right"
            placeholder="Suche"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {companies.map((c) => {
          const isCollapsed = collapsedCompanies[c.id] ?? false;
          const companyApps = filteredApps.filter((a) => a.companyId === c.id);
          const dominantStatus = getCompanyDominantStatus(c.id);
          const sc = getStatusColor(dominantStatus);
          const isEditing = editingCompany?.id === c.id;

          if (companyApps.length === 0 && searchQuery) return null;
          if (companyApps.length === 0 && statusFilter) return null;

          return (
            <div key={c.id}>
              {isEditing ?
                <div className="flex items-center gap-[4px] px-[8px] py-[4px]">
                  <input
                    type="text"
                    value={editingCompany.name}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        name: e.target.value,
                      })
                    }
                    className="flex-1 border border-[#e5e5e5] px-[6px] py-[2px] text-[12px] rounded focus:outline-none focus:border-black"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveCompany();
                      if (e.key === "Escape") setEditingCompany(null);
                    }}
                  />
                  <button
                    onClick={handleSaveCompany}
                    className="p-[2px] hover:bg-brand-lighter rounded"
                  >
                    <Check size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setEditingCompany(null)}
                    className="p-[2px] hover:bg-brand-lighter rounded"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              : <button
                  onClick={() => toggleCompany(c.id)}
                  onContextMenu={(e) => handleContextMenu(e, "company", c.id)}
                  className="w-full flex items-center gap-[6px] px-[8px] py-[4px] hover:bg-brand-lighter rounded text-[14px] transition-colors group text-[#19741d] font-medium text-left"
                >
                  {isCollapsed ?
                    <ChevronRight size={12} strokeWidth={1.5} />
                  : <ChevronDown size={12} strokeWidth={1.5} />}
                  {/* Status-Dot */}
                  <span
                    className="w-[8px] h-[8px] rounded-full shrink-0 border border-white"
                    style={{ backgroundColor: sc.bg }}
                    title={`Status: ${dominantStatus}`}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums mr-[4px] text-[#19741d] font-medium">
                    {c._count.applications}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={11} strokeWidth={1.5} />
                  </span>
                </button>
              }
              {!isCollapsed && (
                <div className="ml-[16px] border-l border-[#e5e5e5] pl-[12px] space-y-[2px] mt-[2px]">
                  {companyApps.map((a) => {
                    const asc = getStatusColor(a.status);
                    return (
                      <button
                        key={a.id}
                        onClick={() => loadApplication(a.id)}
                        onContextMenu={(e) =>
                          handleContextMenu(e, "application", a.id)
                        }
                        className={`w-full text-right px-[8px] py-[4px] rounded text-[12px] transition-colors flex items-center gap-[6px] ${
                          selectedApp?.id === a.id ?
                            "bg-[#f5f5f5] font-medium"
                          : "hover:bg-brand-lighter text-[#374151]"
                        }`}
                      >
                        {/* Status-Dot */}
                        <span className="truncate flex-1">{a.title}</span>
                        <span
                          className="text-[9px] px-[4px] py-[2px] rounded-full whitespace-nowrap shrink-0 font-medium"
                          style={{
                            backgroundColor: asc.bg,
                            color: asc.text,
                          }}
                        >
                          {asc.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Context Menu ---------- */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              closeContextMenu();
            }}
          />
          <div
            className="fixed z-50 bg-white border border-[#e5e5e5] rounded shadow-lg py-[4px] min-w-[140px] text-[12px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 160),
              top: Math.min(contextMenu.y, window.innerHeight - 120),
            }}
          >
            {contextMenu.type === "company" && (
              <>
                <button
                  onClick={() => {
                    const company = companies.find(
                      (c) => c.id === contextMenu.id,
                    );
                    if (company)
                      handleStartEditCompany(company.id, company.name);
                  }}
                  className="flex items-center gap-[8px] w-full px-[12px] py-[6px] hover:bg-brand-lighter transition-colors text-[#19741d] font-medium text-left"
                >
                  <Pencil size={11} strokeWidth={1.5} />
                  Unternehmen umbenennen
                </button>
                <button
                  onClick={() => handleDeleteCompany(contextMenu.id)}
                  className="flex items-center gap-[8px] w-full px-[12px] py-[6px] hover:bg-[#fee2e2] text-[#991b1b] transition-colors font-medium text-left"
                >
                  <Trash2 size={11} strokeWidth={1.5} />
                  Unternehmen löschen
                </button>
              </>
            )}
            {contextMenu.type === "application" && (
              <button
                onClick={() => handleDeleteApplication(contextMenu.id)}
                className="flex items-center gap-[8px] w-full px-[12px] py-[6px] hover:bg-[#fee2e2] text-[#991b1b] transition-colors font-medium text-left"
              >
                <Trash2 size={11} strokeWidth={1.5} />
                Bewerbung löschen
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
