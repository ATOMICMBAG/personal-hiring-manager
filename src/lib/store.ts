import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ApplicationWithRelations {
  id: string;
  title: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    industry?: string | null;
    website?: string | null;
  };
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  jobLink?: string | null;
  status: string;
  deadline?: string | null;
  etaDays?: number | null;
  motivation: number;
  createdAt: string;
  updatedAt: string;
  timelineEvents: TimelineEventItem[];
  documents: DocumentItem[];
  notes: NoteItem[];
  _count?: { timelineEvents: number };
}

export interface CompanyWithCount {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  _count: { applications: number };
  applications: {
    id: string;
    title: string;
    status: string;
    motivation: number;
    createdAt: string;
    timelineEvents: { date: string; status: string }[];
  }[];
}

export interface TimelineEventItem {
  id: string;
  applicationId: string;
  date: string;
  status: string;
  description?: string | null;
}

export interface DocumentItem {
  id: string;
  applicationId: string;
  filename: string;
  filepath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface NoteItem {
  id: string;
  applicationId: string;
  content: string;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  // Data
  companies: CompanyWithCount[];
  selectedApplication: ApplicationWithRelations | null;
  applications: {
    id: string;
    title: string;
    companyId: string;
    companyName: string;
    status: string;
    motivation: number;
  }[];

  // UI state
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  /** Per-Section Höhen (in px). Wenn null → auto. Key = stabile Section-ID. */
  sectionHeights: Record<string, number | null>;
  /** Per-Section collapsed state. Key = stabile Section-ID. */
  sectionCollapsed: Record<string, boolean>;
  activeTab: "timeline" | "documents" | "notes";
  searchQuery: string;
  statusFilter: string;
  isNewApplicationModalOpen: boolean;
  isLoading: boolean;

  // Actions
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  setSectionHeight: (id: string, h: number | null) => void;
  setSectionCollapsed: (id: string, collapsed: boolean) => void;
  setActiveTab: (tab: "timeline" | "documents" | "notes") => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (status: string) => void;
  setNewApplicationModalOpen: (open: boolean) => void;

  // Data actions
  loadCompanies: () => Promise<void>;
  loadApplication: (id: string) => Promise<void>;
  createApplication: (data: CreateApplicationInput) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  updateCompany: (
    id: string,
    data: { name?: string; industry?: string; website?: string },
  ) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addTimelineEvent: (
    appId: string,
    data: { status: string; description?: string; date?: string },
  ) => Promise<void>;
  deleteTimelineEvent: (appId: string, eventId: string) => Promise<void>;
  uploadDocument: (appId: string, file: File) => Promise<void>;

  deleteDocument: (appId: string, docId: string) => Promise<void>;
  saveNote: (appId: string, content: string, tags?: string) => Promise<void>;

  deleteNote: (noteId: string) => Promise<void>;
  exportForAI: () => string;
}

export interface CreateApplicationInput {
  title: string;
  companyName: string;
  companyId?: string;
  contactName?: string;
  contactEmail?: string;
  jobLink?: string;
  status?: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      companies: [],
      selectedApplication: null,
      applications: [],

      // Panel UI defaults
      leftPanelOpen: true, // links initial AUSgeklappt (= sichtbar)
      rightPanelOpen: false, // rechts initial EINgeklappt
      leftPanelWidth: 256,
      rightPanelWidth: 288,
      sectionHeights: {},
      sectionCollapsed: {},

      activeTab: "timeline",
      searchQuery: "",
      statusFilter: "",
      isNewApplicationModalOpen: false,
      isLoading: false,

      setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setLeftPanelWidth: (w) =>
        set({ leftPanelWidth: Math.max(180, Math.min(640, Math.round(w))) }),
      setRightPanelWidth: (w) =>
        set({ rightPanelWidth: Math.max(180, Math.min(640, Math.round(w))) }),
      setSectionHeight: (id, h) =>
        set((s) => ({
          sectionHeights: { ...s.sectionHeights, [id]: h },
        })),
      setSectionCollapsed: (id, collapsed) =>
        set((s) => ({
          sectionCollapsed: { ...s.sectionCollapsed, [id]: collapsed },
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setNewApplicationModalOpen: (open) =>
        set({ isNewApplicationModalOpen: open }),

      loadCompanies: async () => {
        const res = await fetch("/api/companies");
        const companies = await res.json();
        const apps = companies.flatMap((c: CompanyWithCount) =>
          c.applications.map((a) => ({
            id: a.id,
            title: a.title,
            companyId: c.id,
            companyName: c.name,
            status: a.status,
            motivation: a.motivation,
          })),
        );
        set({ companies, applications: apps });
      },

      loadApplication: async (id) => {
        set({ isLoading: true });
        const res = await fetch(`/api/applications/${id}`);
        const app = await res.json();
        set({
          selectedApplication: app,
          isLoading: false,
          activeTab: "timeline",
        });
      },

      createApplication: async (data) => {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await get().loadCompanies();
          const created = await res.json();
          await get().loadApplication(created.id);
          set({ isNewApplicationModalOpen: false });
        }
      },

      deleteApplication: async (id) => {
        const res = await fetch(`/api/applications/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          set({ selectedApplication: null });
          await get().loadCompanies();
        }
      },

      updateCompany: async (id, data) => {
        const res = await fetch(`/api/companies/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await get().loadCompanies();
          // Refresh selected app if it belongs to this company
          const app = get().selectedApplication;
          if (app && app.companyId === id) {
            await get().loadApplication(app.id);
          }
        }
      },

      deleteCompany: async (id) => {
        const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
        if (res.ok) {
          const app = get().selectedApplication;
          if (app && app.companyId === id) {
            set({ selectedApplication: null });
          }
          await get().loadCompanies();
        }
      },

      addTimelineEvent: async (appId, data) => {
        const res = await fetch(`/api/applications/${appId}/timeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await get().loadApplication(appId);
          await get().loadCompanies();
        }
      },

      deleteTimelineEvent: async (appId, eventId) => {
        const res = await fetch(
          `/api/applications/${appId}/timeline/${eventId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          await get().loadApplication(appId);
          await get().loadCompanies();
        }
      },

      uploadDocument: async (appId, file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/applications/${appId}/documents`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          await get().loadApplication(appId);
        }
      },

      deleteDocument: async (appId, docId) => {
        const res = await fetch(
          `/api/applications/${appId}/documents/${docId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          await get().loadApplication(appId);
        }
      },

      saveNote: async (appId, content, tags) => {
        const res = await fetch(`/api/applications/${appId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, tags }),
        });
        if (res.ok) {
          await get().loadApplication(appId);
        }
      },

      deleteNote: async (noteId) => {
        const app = get().selectedApplication;
        if (!app) return;
        const res = await fetch(
          `/api/applications/${app.id}/notes?id=${noteId}`,
          {
            method: "DELETE",
          },
        );
        if (res.ok) {
          await get().loadApplication(app.id);
        }
      },

      exportForAI: () => {
        const app = get().selectedApplication;
        if (!app) return "";
        return JSON.stringify(
          {
            application: {
              title: app.title,
              company: app.company.name,
              status: app.status,
              contact: { name: app.contactName, email: app.contactEmail },
              motivation: app.motivation,
              etaDays: app.etaDays,
            },
            timeline: app.timelineEvents.map((e) => ({
              date: e.date,
              status: e.status,
              description: e.description,
            })),
            notes: app.notes.map((n) => ({ content: n.content, tags: n.tags })),
          },
          null,
          2,
        );
      },
    }),
    {
      name: "phm-ui-state",
      storage: createJSONStorage(() => localStorage),
      // Nur UI-/Layout-State persistieren, keine geladenen Daten
      partialize: (state) => ({
        leftPanelOpen: state.leftPanelOpen,
        rightPanelOpen: state.rightPanelOpen,
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        sectionHeights: state.sectionHeights,
        sectionCollapsed: state.sectionCollapsed,
      }),
      version: 1,
    },
  ),
);
