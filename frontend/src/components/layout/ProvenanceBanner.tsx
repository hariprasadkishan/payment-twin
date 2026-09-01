import React from "react";
import { ProvenanceType } from "@/types/provenance";
import { ShieldCheck, Sparkles, AlertCircle, Info } from "lucide-react";
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
          "px-4 py-2.5 rounded-lg bg-twin-cyan/10 border border-twin-cyan/25 text-twin-cyan text-xs flex items-center justify-between shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-twin-cyan" />
          <span>
            <strong>Observed Razorpay Data Active</strong>: Baseline calibrated on {sampleSize > 0 ? `${sampleSize.toLocaleString()} verified` : "real"} merchant transactions ingested from Razorpay Test Mode (DNA v{dnaVersion}).
          </span>
        </div>
        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-twin-cyan/20 border border-twin-cyan/30 uppercase tracking-wider">
          Observed Razorpay
        </span>
      </div>
    );
  }

  if (provenance === "SYNTHETIC_BENCHMARK_DATA") {
    return (
      <div
        className={cn(
          "px-4 py-2.5 rounded-lg bg-twin-warning/10 border border-twin-warning/25 text-twin-warning text-xs flex items-center justify-between shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-twin-warning" />
          <span>
            <strong>Synthetic Benchmark Data Active</strong>: {sampleSize > 0 ? `${sampleSize.toLocaleString()} aggregate benchmark records` : "650 benchmark records"} are powering the current workspace. All outputs represent synthetic simulation projections and are strictly distinct from live Razorpay transactions.
          </span>
        </div>
        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-twin-warning/20 border border-twin-warning/30 uppercase tracking-wider">
          Synthetic Benchmark
        </span>
      </div>
    );
  }

  if (provenance === "MIXED_DERIVED") {
    return (
      <div
        className={cn(
          "px-4 py-2.5 rounded-lg bg-twin-indigo/10 border border-twin-indigo/25 text-twin-indigo text-xs flex items-center justify-between shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-twin-indigo" />
          <span>
            <strong>Counterfactual Twin Simulation</strong>: Forward projections derived from Customer Agent state-machines. Metrics are scenario estimates.
          </span>
        </div>
        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-twin-indigo/20 border border-twin-indigo/30 uppercase tracking-wider">
          Simulation Output
        </span>
      </div>
    );
  }

  // NO_DATA_AVAILABLE / UNAVAILABLE
  return (
    <div
      className={cn(
        "px-4 py-2.5 rounded-lg bg-twin-card/70 border border-twin-border text-twin-slate text-xs flex items-center justify-between shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-twin-slate/70 shrink-0" />
        <span>
          <strong>No Data Available</strong>: Connect your Razorpay Test Mode account to ingest payments, or load the synthetic benchmark dataset in Settings to evaluate Payment Twin.
        </span>
      </div>
      <span className="font-mono text-[11px] text-twin-slate/70 px-2 py-0.5 rounded bg-twin-card border border-twin-border uppercase tracking-wider">
        Awaiting Data
      </span>
    </div>
  );
};
