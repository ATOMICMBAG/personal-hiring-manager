"use client";

import { useCallback, useEffect, useRef } from "react";

type Direction = "left" | "right";

interface PanelResizerProps {
  /** Aktuelle Breite des Panels in px */
  width: number;
  /** Callback während des Draggings (in px). */
  onResize: (newWidth: number) => void;
  /**
   * "right" = Handle befindet sich am RECHTEN Rand des Panels (z.B. linke Sidebar).
   * "left"  = Handle befindet sich am LINKEN Rand des Panels (z.B. rechte Sidebar).
   */
  side: Direction;
  /** Min/Max in px. Defaults: 180 / 640. */
  min?: number;
  max?: number;
}

/**
 * Vertikaler 4px-Streifen am Rand einer Sidebar. Klick + Drag verändert die Breite.
 */
export function PanelResizer({
  width,
  onResize,
  side,
  min = 180,
  max = 640,
}: PanelResizerProps) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return;
      // requestAnimationFrame throttling – verhindert Layout-Storm
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const dx = e.clientX - startXRef.current;
        // "right"-Handle: nach rechts ziehen = breiter
        // "left"-Handle: nach links ziehen = breiter (Vorzeichen invertiert)
        const delta = side === "right" ? dx : -dx;
        const next = Math.max(
          min,
          Math.min(max, startWidthRef.current + delta),
        );
        onResize(next);
      });
    },
    [onResize, side, min, max],
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

  const start = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
  };

  // Cleanup, falls Komponente unmountet während Drag
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [onMouseMove, stop]);

  // Optionaler Doppelklick → Reset auf Default
  const onDoubleClick = () => onResize(side === "right" ? 256 : 288);

  return (
    <div
      onMouseDown={start}
      onDoubleClick={onDoubleClick}
      title="Ziehen zum Anpassen der Breite (Doppelklick: Reset)"
      className={[
        "absolute top-0 bottom-0 z-20 w-[6px] cursor-col-resize group",
        // Side-Positionierung
        side === "right" ? "right-[-3px]" : "left-[-3px]",
      ].join(" ")}
    >
      {/* Akzent Hover */}
      <div
        className={[
          "absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px]",
          "bg-transparent group-hover:bg-[#19741d]/40 transition-colors",
        ].join(" ")}
      />
    </div>
  );
}
