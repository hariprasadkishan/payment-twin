import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ProvenanceBanner } from "./ProvenanceBanner";
import { useAppStore } from "@/store/useAppStore";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentProvenance } = useAppStore();

  return (
    <div className="min-h-screen bg-twin-bg text-twin-white flex font-sans antialiased selection:bg-twin-cyan/30 selection:text-twin-cyan">
      <ScrollProgress />

      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <ProvenanceBanner provenance={currentProvenance} />
          {children}
        </main>
      </div>
    </div>
  );
};
