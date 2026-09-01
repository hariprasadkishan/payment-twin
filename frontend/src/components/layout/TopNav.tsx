import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { PageId } from "@/types/navigation";
import { LoopAnimation } from "@/components/ui/LoopAnimation";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  overview: {
    title: "Command Center",
    subtitle: "Real-time payment health, Guardian surveillance & simulation benchmarks",
  },
  dna: {
    title: "Behavioral DNA Profile",
    subtitle: "Empirical merchant priors, success dynamics, ticket size & failure diagnostics",
  },
  agents: {
    title: "Customer Agent Studio",
    subtitle: "Synthetic population calibrated on empirical behavioral archetypes",
  },
  guardian: {
    title: "Payment Guardian Sentinel",
    subtitle: "Statistical telemetry drift surveillance, multi-testing FDR & anomaly triage",
  },
  twin: {
    title: "Payment Twin Funnel Simulator",
    subtitle: "Discrete-event customer agent payment lifecycle & aggregate conversion",
  },
  scenarios: {
    title: "What-If Scenario Studio",
    subtitle: "Counterfactual intervention modeling with paired Common Random Numbers",
  },
  pareto: {
    title: "Pareto Multi-Objective Frontier",
    subtitle: "Multi-dimensional trade-off exploration balancing revenue, conversion & fees",
  },
  settings: {
    title: "Data & System Settings",
    subtitle: "Razorpay Test Mode API credentials, JSONL datasets & provenance auditing",
  },
};

export const TopNav: React.FC = () => {
  const { activePage, currentProvenance, systemHealth } = useAppStore();
  const pageMeta = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  return (
    <header className="h-16 px-6 border-b border-twin-border/80 bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
      {/* Page Title Context */}
      <div className="flex flex-col">
        <h1 className="text-base font-display font-bold text-twin-white tracking-tight">
          {pageMeta.title}
        </h1>
        <span className="text-[11px] text-twin-slate hidden md:block">
          {pageMeta.subtitle}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <ProvenanceTag provenance={currentProvenance} />
        <LoopAnimation
          status={systemHealth === "healthy" ? "active" : systemHealth === "degraded" ? "warning" : "idle"}
          label={systemHealth === "healthy" ? "SYSTEM READY" : "AWAITING INGESTION"}
        />
      </div>
    </header>
  );
};
