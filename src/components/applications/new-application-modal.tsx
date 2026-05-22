"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { X } from "lucide-react";

export function NewApplicationModal() {
  const companies = useAppStore((s) => s.companies);
  const setNewApplicationModalOpen = useAppStore(
    (s) => s.setNewApplicationModalOpen,
  );
  const createApplication = useAppStore((s) => s.createApplication);

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [useExistingCompany, setUseExistingCompany] = useState(true);

  const matchingCompanies = useMemo(() => {
    if (!companyName) return companies.slice(0, 5);
    return companies
      .filter((c) => c.name.toLowerCase().includes(companyName.toLowerCase()))
      .slice(0, 5);
  }, [companyName, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createApplication({
      title,
      companyName: useExistingCompany ? "" : companyName,
      companyId: useExistingCompany ? companyId : undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      jobLink: jobLink || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={() => setNewApplicationModalOpen(false)}
    >
      <div
        className="bg-white border border-[#e5e5e5] rounded-lg shadow-lg w-full max-w-md mx-4 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5]">
          <h3 className="text-sm font-semibold">Neue Bewerbung</h3>
          <button
            onClick={() => setNewApplicationModalOpen(false)}
            className="p-1 hover:bg-[#f5f5f5] rounded transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium mb-1">
              Position *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-[#e5e5e5] px-2 py-1.5 text-xs rounded focus:outline-none focus:border-black transition-colors"
              placeholder="z. B. Software Engineer"
            />
          </div>

          {/* Company: existing or new */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={useExistingCompany}
                onChange={() => setUseExistingCompany(true)}
                className="accent-black"
              />
              Bestehende Firma
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={!useExistingCompany}
                onChange={() => setUseExistingCompany(false)}
                className="accent-black"
              />
              Neue Firma
            </label>
          </div>

          {useExistingCompany ?
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium mb-1">
                Firma
              </label>
              <div className="space-y-1">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full border border-[#e5e5e5] px-2 py-1.5 text-xs rounded focus:outline-none focus:border-black transition-colors"
                />
                {matchingCompanies.length > 0 && (
                  <div className="border border-[#e5e5e5] rounded max-h-32 overflow-y-auto">
                    {matchingCompanies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCompanyId(c.id);
                          setCompanyName(c.name);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs hover:bg-[#f5f5f5] transition-colors ${
                          companyId === c.id ? "bg-[#f5f5f5] font-medium" : ""
                        }`}
                      >
                        {c.name}
                        <span className="text-[#9ca3af] ml-2">
                          ({c._count.applications})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          : <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium mb-1">
                Neue Firma *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={!useExistingCompany}
                placeholder="z. B. Siemens AG"
                className="w-full border border-[#e5e5e5] px-2 py-1.5 text-xs rounded focus:outline-none focus:border-black transition-colors"
              />
            </div>
          }

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium mb-1">
                Kontakt
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name"
                className="w-full border border-[#e5e5e5] px-2 py-1.5 text-xs rounded focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="E-Mail"
                className="w-full border border-[#e5e5e5] px-2 py-1.5 text-xs rounded focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Job Link */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium mb-1">
              Job-Link
            </label>
            <input
              type="url"
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder="https://..."
              className="w-full border border-[#e5e5e5] px-2 py-1.5 text-xs rounded focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#1a1a1a] text-white px-4 py-2 text-xs rounded hover:bg-black transition-colors"
            >
              Bewerbung anlegen
            </button>
            <button
              type="button"
              onClick={() => setNewApplicationModalOpen(false)}
              className="px-4 py-2 text-xs border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
