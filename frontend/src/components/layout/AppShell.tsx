import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ProvenanceBanner } from "./ProvenanceBanner";
import { useAppStore } from "@/store/useAppStore";
import { useDNAStatus } from "@/hooks/useDNA";
import { ProvenanceType } from "@/types/provenance";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentProvenance, setCurrentProvenance, setSystemHealth } = useAppStore();
  const { data: dnaStatus } = useDNAStatus();

  React.useEffect(() => {
    if (dnaStatus?.profiling_available) {
      setCurrentProvenance(dnaStatus.provenance_type as ProvenanceType);
      setSystemHealth("healthy");
    } else if (dnaStatus?.provenance_type === "NO_DATA_AVAILABLE") {
      setCurrentProvenance("UNAVAILABLE");
      setSystemHealth("unavailable");
    }
  }, [dnaStatus, setCurrentProvenance, setSystemHealth]);

  const provenance = (dnaStatus?.profiling_available
    ? dnaStatus.provenance_type
    : currentProvenance) as ProvenanceType;

  return (
    <div className="flex min-h-screen bg-canvas text-textPrimary">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Workspace Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 flex-1">
          <ProvenanceBanner
            provenance={provenance}
            sampleSize={dnaStatus?.available_sample_count ?? 0}
          />
          {children}
        </main>
      </div>
    </div>
  );
};

