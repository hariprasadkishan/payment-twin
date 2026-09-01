import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ProvenanceBanner } from "./ProvenanceBanner";
import { useAppStore } from "@/store/useAppStore";
import { useDNAStatus } from "@/hooks/useDNA";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentProvenance, setCurrentProvenance, setSystemHealth } = useAppStore();
  const { data: dnaStatus } = useDNAStatus();

  React.useEffect(() => {
    if (dnaStatus && dnaStatus.profiling_available) {
      setCurrentProvenance(dnaStatus.provenance_type as any);
      setSystemHealth("healthy");
    } else if (dnaStatus && dnaStatus.provenance_type === "NO_DATA_AVAILABLE") {
      setCurrentProvenance("UNAVAILABLE");
      setSystemHealth("unavailable");
    }
  }, [dnaStatus, setCurrentProvenance, setSystemHealth]);

  const activeProvenance = dnaStatus && dnaStatus.profiling_available
    ? (dnaStatus.provenance_type as any)
    : currentProvenance;

  return (
    <div className="min-h-screen bg-twin-bg text-twin-white flex font-sans antialiased selection:bg-twin-cyan/30 selection:text-twin-cyan">
      <ScrollProgress />

      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <ProvenanceBanner
            provenance={activeProvenance}
            sampleSize={dnaStatus?.available_sample_count ?? 0}
          />
          {children}
        </main>
      </div>
    </div>
  );
};
