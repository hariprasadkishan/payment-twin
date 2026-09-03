import React from "react";
import { TwinScenarioHandoff } from "@/types/handoff";
import { SimulationKPIs } from "@/types/simulation";
import { Dna } from "lucide-react";

interface BaselineReferenceStripProps {
  handoff: TwinScenarioHandoff | null;
  baselineKPIs?: SimulationKPIs | null;
  populationSize: number;
  randomSeed: number;
}

export const BaselineReferenceStrip: React.FC<BaselineReferenceStripProps> = ({
  handoff,
  baselineKPIs,
  populationSize,
  randomSeed,
}) => {
  // Extract values preferring direct baselineKPIs if comparison already run, otherwise handoff, otherwise defaults
  const convRate = baselineKPIs?.conversion_rate_percent ?? handoff?.baseline_conversion_rate ?? 83.0;
  const netRev = baselineKPIs?.net_merchant_revenue_inr ?? handoff?.baseline_net_revenue ?? 1586229;
  const failRate = baselineKPIs?.failure_rate_percent ?? handoff?.baseline_failure_rate ?? 15.5;
  const attempts = baselineKPIs?.total_payment_attempts ?? 1123;
  const fees = baselineKPIs?.total_processing_fees_inr ?? 10492;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-3.5 shadow-panel space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline/60 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-subtle border border-hairline text-textSecondary">
            <Dna className="size-3.5 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <span className="font-semibold text-textPrimary text-xs">
              Simulation Baseline Reference Point
            </span>
            <span className="text-textTertiary text-[11px] ml-1.5 font-mono">
              ({handoff ? "Imported from Payment Twin" : "Calibrated Empirical Prior"})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-textTertiary">
          <span className="px-1.5 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            CRN Paired: Seed {randomSeed}
          </span>
          <span className="px-1.5 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            N = {populationSize.toLocaleString()} agents
          </span>
        </div>
      </div>

      {/* 5-Metric Reference Ribbon with Hairline Dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-canvas/40 rounded-md border border-hairline/70 overflow-hidden text-xs font-mono">
        {/* Metric 1: Baseline Conversion */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Baseline Conversion
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums">
            {convRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            {handoff ? "Pre-intervention rate" : "Empirical reference"}
          </span>
        </div>

        {/* Metric 2: Baseline Net Revenue */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Baseline Net Revenue
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums">
            ₹{netRev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            After gateway MDR fees
          </span>
        </div>

        {/* Metric 3: Baseline Failure Rate */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Terminal Failure Rate
          </span>
          <div className="text-sm font-bold text-red-700 tabular-nums">
            {failRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Exhausted retries / hard declines
          </span>
        </div>

        {/* Metric 4: Total Attempts */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Payment Attempts
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums">
            {attempts.toLocaleString()}
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Including retries
          </span>
        </div>

        {/* Metric 5: Gateway Fees */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Processing Fees
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums">
            ₹{fees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Acquirer interchange MDR
          </span>
        </div>
      </div>
    </div>
  );
};
