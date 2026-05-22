"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { MainLayout } from "@/components/layout/main-layout";
import { NewApplicationModal } from "@/components/applications/new-application-modal";

export default function HomePage() {
  const loadCompanies = useAppStore((s) => s.loadCompanies);
  const isNewAppModalOpen = useAppStore((s) => s.isNewApplicationModalOpen);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return (
    <>
      <MainLayout />
      {isNewAppModalOpen && <NewApplicationModal />}
    </>
  );
}
