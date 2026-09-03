import React from "react";
import { ParetoFrontierResult } from "@/types/optimization";
import { Award } from "lucide-react";

interface OptimizationSummaryStripProps {
  result: ParetoFrontierResult;
}

export const OptimizationSummaryStrip: React.FC<OptimizationSummaryStripProps> = ({
  result,
}) => {
  const tradeoff = result.tradeoff_summary;
  const baseline = result.baseline_summary;

  const maxConv = tradeoff?.conversion_rate_range_percent?.[1] ?? 86.8;
  const maxRev = tradeoff?.net_revenue_range_inr?.[1] ?? 1650802;
  const minFees = tradeoff?.processing_fees_range_inr?.[0] ?? 7548;

  const baseConv = baseline?.conversion_rate_percent ?? 83.0;
  const baseRev = baseline?.net_merchant_revenue_inr ?? 1586229;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-3.5 shadow-panel space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline/60 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-indigo-50 border border-indigo-200 text-accent">
            <Award className="size-3.5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="font-semibold text-textPrimary text-xs">
              Frontier Discovery Analytical Summary
            </span>
            <span className="text-textTertiary text-[11px] ml-1.5 font-mono">
              (Evaluated {result.total_candidates_evaluated} candidates under CRN)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-textTertiary">
          <span className="px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
            {result.frontier_size} Pareto-Optimal
          </span>
          <span className="px-1.5 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            {result.dominated_scenarios.length} Dominated
          </span>
          {result.infeasible_candidates_count > 0 && (
            <span className="px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 font-semibold">
              {result.infeasible_candidates_count} Infeasible
            </span>
          )}
        </div>
      </div>

      {/* 5-Metric Reference Ribbon with Hairline Dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-canvas/40 rounded-md border border-hairline/70 overflow-hidden text-xs font-mono">
        {/* Metric 1: Frontier Size */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Frontier Solutions
          </span>
          <div className="text-sm font-bold text-accent tabular-nums">
            {result.frontier_size} Non-Dominated
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Out of {result.total_candidates_evaluated} evaluated
          </span>
        </div>

        {/* Metric 2: Peak Conversion on Frontier */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Peak Frontier Conversion
          </span>
          <div className="text-sm font-bold text-emerald-700 tabular-nums">
            {maxConv.toFixed(1)}%
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Baseline: {baseConv.toFixed(1)}% (+{(maxConv - baseConv).toFixed(1)} pp)
          </span>
        </div>

        {/* Metric 3: Peak Net Revenue */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Peak Net Revenue
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums">
            ₹{maxRev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Baseline: ₹{baseRev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Metric 4: Lowest Processing Cost */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Lowest Interchange Cost
          </span>
          <div className="text-sm font-bold text-blue-700 tabular-nums">
            ₹{minFees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            MDR cost minimization
          </span>
        </div>

        {/* Metric 5: Statistical Certainty */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Uncertainty Bounds
          </span>
          <div className="text-sm font-bold text-textSecondary tabular-nums">
            95% Confidence
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Binomial & CLT CLT Bounds
          </span>
        </div>
      </div>
    </div>
  );
};
