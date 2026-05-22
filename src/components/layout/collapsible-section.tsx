"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface CollapsibleSectionProps {
  /** Stabile ID – wird für Persistenz in localStorage genutzt. */
  id: string;
  title: ReactNode;
  children: ReactNode;
  /** Standardmäßig aufgeklappt? Default: true */
  defaultOpen?: boolean;
  /** Minimale Höhe in px bei manueller Größe. */
  minHeight?: number;
  /** Maximale Höhe in px bei manueller Größe. */
  maxHeight?: number;
  /** Zusätzliche Klassen am Wurzelelement. */
  className?: string;
  /** Header-Ausrichtung (rechte Sidebar nutzt z.B. text-end). */
  align?: "start" | "end";
}

/**
 * Faltbare Sektion mit optional per Maus verstellbarer Höhe.
 *
 * - Klick auf Header → toggle collapse
 * - Drag am unteren Rand → fixe Höhe setzen (Inhalt wird scrollbar)
 * - Doppelklick auf Drag-Handle → Höhe zurücksetzen (auto)
 *
 * Zustand wird im Zustand-Store (sectionHeights / sectionCollapsed) gehalten
 * und über localStorage persistiert.
 */
export function CollapsibleSection({
  id,
  title,
  children,
  defaultOpen = true,
  minHeight = 60,
  maxHeight = 800,
  className = "",
  align = "start",
}: CollapsibleSectionProps) {
  const storedCollapsed = useAppStore((s) => s.sectionCollapsed[id]);
  const storedHeight = useAppStore((s) => s.sectionHeights[id]);
  const setCollapsed = useAppStore((s) => s.setSectionCollapsed);
  const setHeight = useAppStore((s) => s.setSectionHeight);

  // Wenn noch kein Wert gespeichert: defaultOpen verwenden
  const collapsed =
    storedCollapsed === undefined ? !defaultOpen : storedCollapsed;
  const explicitHeight = storedHeight ?? null;

  // ----- Drag-Handle für Höhe -----
  const startYRef = useRef(0);
  const startHRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const dy = e.clientY - startYRef.current;
        const next = Math.max(
          minHeight,
          Math.min(maxHeight, startHRef.current + dy),
        );
        setHeight(id, next);
      });
    },
    [id, setHeight, minHeight, maxHeight],
  );

  const stop = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stop);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [onMouseMove]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startYRef.current = e.clientY;
    // aktuelle gemessene Höhe als Startwert
    startHRef.current =
      explicitHeight ?? bodyRef.current?.offsetHeight ?? minHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [onMouseMove, stop]);

  const resetHeight = () => setHeight(id, null);

  return (
    <section className={"flex flex-col " + className}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(id, !collapsed)}
        className={[
          "w-full flex items-center gap-[6px] py-[4px] px-[4px]",
          "text-[10px] uppercase tracking-widest text-[#9ca3af] font-medium",
          "hover:text-[#374151] transition-colors rounded",
          align === "end" ? "justify-end flex-row-reverse" : "justify-start",
        ].join(" ")}
        title={collapsed ? "Ausklappen" : "Einklappen"}
      >
        {collapsed ?
          <ChevronRight size={11} strokeWidth={1.8} />
        : <ChevronDown size={11} strokeWidth={1.8} />}
        <span className="flex-1 text-left">{title}</span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="relative">
          <div
            ref={bodyRef}
            className="overflow-y-auto"
            style={
              explicitHeight !== null ?
                { height: `${explicitHeight}px` }
              : undefined
            }
          >
            <div className="pt-[4px] pb-[4px]">{children}</div>
          </div>

          {/* Drag-Handle für Höhe */}
          <div
            onMouseDown={startDrag}
            onDoubleClick={resetHeight}
            title="Ziehen für Höhe (Doppelklick: auto)"
            className="h-[6px] cursor-row-resize group relative -mb-[2px]"
          >
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-transparent group-hover:bg-[#19741d]/40 transition-colors rounded" />
          </div>
        </div>
      )}
    </section>
  );
}
