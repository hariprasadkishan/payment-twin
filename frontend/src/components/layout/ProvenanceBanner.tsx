import React from "react";
import { ProvenanceType } from "@/types/provenance";
import { ShieldCheck, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProvenanceBannerProps {
  provenance: ProvenanceType;
  dnaVersion?: string;
  sampleSize?: number;
  className?: string;
}

export const ProvenanceBanner: React.FC<ProvenanceBannerProps> = ({
  provenance,
  dnaVersion = "1.0.0",
  sampleSize = 0,
  className,
}) => {
  if (provenance === "OBSERVED_RAZORPAY_DATA") {
    return (
      <div
        className={cn(
          "px-4 py-2 rounded-lg bg-twin-cyan/10 border border-twin-cyan/20 text-twin-cyan text-xs flex items-center justify-between",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>Observed Razorpay Telemetry</strong>: Baseline calibrated on {sampleSize.toLocaleString()} real merchant transactions (DNA v{dnaVersion}).
          </span>
        </div>
        <span className="font-mono text-[11px] opacity-80 uppercase">Audited Baseline</span>
      </div>
    );
  }

  if (provenance === "SYNTHETIC_BENCHMARK_DATA") {
    return (
      <div
        className={cn(
          "px-4 py-2 rounded-lg bg-twin-indigo/10 border border-twin-indigo/20 text-twin-indigo text-xs flex items-center justify-between",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>Synthetic Benchmark Active</strong>: Calibrated cold-start empirical profile. Outcomes represent simulation estimates.
          </span>
        </div>
        <span className="font-mono text-[11px] opacity-80 uppercase">Benchmark Mode</span>
      </div>
    );
  }

  if (provenance === "MIXED_DERIVED") {
    return (
      <div
        className={cn(
          "px-4 py-2 rounded-lg bg-twin-warning/10 border border-twin-warning/20 text-twin-warning text-xs flex items-center justify-between",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>Counterfactual Twin Simulation</strong>: Derived from Customer Agent state-machines. Metrics are scenario projections.
          </span>
        </div>
        <span className="font-mono text-[11px] opacity-80 uppercase">Simulation Output</span>
      </div>
    );
  }

  // UNAVAILABLE
  return (
    <div
      className={cn(
        "px-4 py-2.5 rounded-lg bg-twin-card/70 border border-twin-border text-twin-slate text-xs flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-twin-slate/70 shrink-0" />
        <span>
          <strong>No Observed Data</strong>: Ingest payments from your Razorpay Test Mode account or load a dataset to calibrate Behavioral DNA.
        </span>
      </div>
      <span className="font-mono text-[11px] text-twin-slate/60 uppercase">Awaiting Ingestion</span>
    </div>
  );
};
