"use client";

import { useAppStore } from "@/lib/store";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { PanelResizer } from "./panel-resizer";
import { ApplicationDetail } from "../applications/application-detail";

export function MainLayout() {
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);
  const leftPanelWidth = useAppStore((s) => s.leftPanelWidth);
  const rightPanelWidth = useAppStore((s) => s.rightPanelWidth);
  const setLeftPanelOpen = useAppStore((s) => s.setLeftPanelOpen);
  const setRightPanelOpen = useAppStore((s) => s.setRightPanelOpen);
  const setLeftPanelWidth = useAppStore((s) => s.setLeftPanelWidth);
  const setRightPanelWidth = useAppStore((s) => s.setRightPanelWidth);
  const selectedApp = useAppStore((s) => s.selectedApplication);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="h-11 border-b border-[#e5e5e5] flex items-center px-4 gap-3 shrink-0 select-none">
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="p-1 hover:bg-[#f5f5f5] rounded transition-colors"
          title={
            leftPanelOpen ? "Linkes Panel schließen" : "Linkes Panel öffnen"
          }
        >
          {leftPanelOpen ?
            <PanelLeftClose size={18} strokeWidth={1.5} />
          : <PanelLeftOpen size={18} strokeWidth={1.5} />}
        </button>
        <span className="font-semibold text-sm tracking-wide flex-1">
          maazi.de | Personal Hiring Manager
        </span>
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-1 hover:bg-[#f5f5f5] rounded transition-colors"
          title={
            rightPanelOpen ? "Rechtes Panel schließen" : "Rechtes Panel öffnen"
          }
        >
          {rightPanelOpen ?
            <PanelRightClose size={18} strokeWidth={1.5} />
          : <PanelRightOpen size={18} strokeWidth={1.5} />}
        </button>
      </header>

      {/* 3-Panel Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside
          className={[
            "relative shrink-0 overflow-hidden transition-[width] duration-150 ease-out",
            leftPanelOpen ? "border-r border-[#e5e5e5]" : "border-r-0",
          ].join(" ")}
          style={{ width: leftPanelOpen ? `${leftPanelWidth}px` : "0px" }}
        >
          {/* Inhaltscontainer behält die volle Breite, wird aber vom <aside>
              abgeschnitten, wenn dieser auf 0 px schrumpft (= eingeklappt). */}
          <div
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ width: `${leftPanelWidth}px` }}
          >
            <LeftSidebar />
          </div>
          {/* Resize-Handle nur sichtbar wenn Panel offen */}
          {leftPanelOpen && (
            <PanelResizer
              width={leftPanelWidth}
              onResize={setLeftPanelWidth}
              side="right"
            />
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white min-w-0">
          {selectedApp ?
            <ApplicationDetail />
          : <div className="flex items-center justify-center h-full text-[#9ca3af] select-none">
              <div className="text-center space-y-3">
                <p className="text-sm">
                  Ein Job-Bewerbungs-Tracker im Desktop-Stil,
                </p>
                <p className="text-sm">
                  der jede Bewerbung strukturiert, durchsuchbar
                </p>
                <p className="text-sm">und dabei vollständig auf Ihrem</p>
                <p className="text-sm">eigenen Rechner läuft.</p>
                <div className="text-5xl p-20">!</div>
                <p className="text-sm">
                  Wähle eine Position aus der linken Unternehmensliste
                </p>
                <p className="text-sm">
                  oder Erstelle ein neues Unternehmen mit neuer Position
                </p>
              </div>
            </div>
          }
        </main>

        {/* Right Panel */}
        <aside
          className={[
            "relative shrink-0 overflow-hidden transition-[width] duration-150 ease-out",
            rightPanelOpen ? "border-l border-[#e5e5e5]" : "border-l-0",
          ].join(" ")}
          style={{ width: rightPanelOpen ? `${rightPanelWidth}px` : "0px" }}
        >
          <div
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ width: `${rightPanelWidth}px` }}
          >
            <RightSidebar />
          </div>
          {rightPanelOpen && (
            <PanelResizer
              width={rightPanelWidth}
              onResize={setRightPanelWidth}
              side="left"
            />
          )}
        </aside>
      </div>
    </div>
  );
}
