import React from "react";
import { Database, FlaskConical, Info } from "lucide-react";
import { ProvenanceType } from "@/types/provenance";
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
  const content = React.useMemo(() => {
    switch (provenance) {
      case "OBSERVED_RAZORPAY_DATA":
        return {
          icon: Database,
          label: "Observed Razorpay Data",
          badge: "Live Calibration",
          text: `Calibrated against ${
            sampleSize > 0 ? `${sampleSize.toLocaleString()} verified merchant transactions` : "verified merchant transactions"
          } from Razorpay Test Mode (Behavioral DNA v${dnaVersion}).`,
          tone: "text-emerald-800 bg-emerald-50/80 border-emerald-200",
          iconTone: "text-emerald-600",
          badgeTone: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
      case "SYNTHETIC_BENCHMARK_DATA":
        return {
          icon: FlaskConical,
          label: "Synthetic Benchmark",
          badge: "Benchmark Mode",
          text: `${
            sampleSize > 0 ? `${sampleSize.toLocaleString()} calibrated payment records` : "Benchmark records"
          } power this model. Forward simulation outputs are probabilistic projections, not observed historical facts.`,
          tone: "text-blue-900 bg-blue-50/70 border-blue-200",
          iconTone: "text-blue-600",
          badgeTone: "bg-blue-100 text-blue-800 border-blue-300",
        };
      case "MIXED_DERIVED":
        return {
          icon: FlaskConical,
          label: "Simulation Projection",
          badge: "Synthetic Derived",
          text: "Forward conversion estimates are synthesized from the customer agent population and active scenario assumptions.",
          tone: "text-indigo-950 bg-indigo-50/60 border-indigo-200",
          iconTone: "text-indigo-600",
          badgeTone: "bg-indigo-100 text-indigo-800 border-indigo-300",
        };
      default:
        return {
          icon: Info,
          label: "Awaiting Data Connection",
          badge: "Data Idle",
          text: "Connect your Razorpay Test Key or initialize the Synthetic Benchmark in Settings to calibrate Behavioral DNA.",
          tone: "text-textSecondary bg-surface border-hairline",
          iconTone: "text-textTertiary",
          badgeTone: "bg-subtle text-textSecondary border-hairline",
        };
    }
  }, [provenance, sampleSize, dnaVersion]);

  const Icon = content.icon;

  return (
    <aside
      aria-label="Data provenance notice"
      className={cn(
        "mb-5 flex items-start gap-3 rounded-md border px-3.5 py-2.5 text-xs transition-colors",
        content.tone,
        className
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", content.iconTone)} strokeWidth={1.75} />
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold tracking-tight">{content.label}:</span>
        <span className="leading-relaxed opacity-95">{content.text}</span>
      </div>
      <span
        className={cn(
          "hidden sm:inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-tight",
          content.badgeTone
        )}
      >
        {content.badge}
      </span>
    </aside>
  );
};

