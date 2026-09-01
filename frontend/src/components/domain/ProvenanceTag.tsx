import React from "react";
import { ProvenanceType } from "@/types/provenance";
import { Database, Sparkles, HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export interface ProvenanceTagProps {
  provenance: ProvenanceType;
  sampleSize?: number;
  className?: string;
}

export const ProvenanceTag: React.FC<ProvenanceTagProps> = ({
  provenance,
  sampleSize,
  className,
}) => {
  const configs = {
    OBSERVED_RAZORPAY_DATA: {
      label: "OBSERVED TELEMETRY",
      variant: "border-twin-cyan/40 bg-twin-cyan/10 text-twin-cyan",
      icon: Database,
      tooltip: "Ground truth payment records ingested from merchant Razorpay account.",
    },
    SYNTHETIC_BENCHMARK_DATA: {
      label: "BENCHMARK PROFILE",
      variant: "border-twin-indigo/40 bg-twin-indigo/10 text-twin-indigo",
      icon: Sparkles,
      tooltip: "Calibrated empirical benchmark used for cold-start testing.",
    },
    MIXED_DERIVED: {
      label: "DERIVED / SIMULATED",
      variant: "border-twin-warning/40 bg-twin-warning/10 text-twin-warning",
      icon: Sparkles,
      tooltip: "Counterfactual simulation result derived from Customer Agent models.",
    },
    UNAVAILABLE: {
      label: "DATA UNAVAILABLE",
      variant: "border-twin-border bg-twin-card text-twin-slate",
      icon: HelpCircle,
      tooltip: "No observed payment records or baseline profile available.",
    },
  };

  const cfg = configs[provenance] || configs.UNAVAILABLE;
  const Icon = cfg.icon;

  return (
    <Tooltip content={cfg.tooltip}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border font-medium cursor-help transition-colors",
          cfg.variant,
          className
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{cfg.label}</span>
        {sampleSize !== undefined && sampleSize > 0 && (
          <span className="opacity-75 font-normal">({sampleSize.toLocaleString()} records)</span>
        )}
      </div>
    </Tooltip>
  );
};
