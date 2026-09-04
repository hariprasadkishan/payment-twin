import React from "react";
import { ParetoFrontierResult, ParetoScenarioItem } from "@/types/optimization";
import { Award, CheckCircle2, Sparkles, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizationSummaryStripProps {
  result: ParetoFrontierResult;
  preferredCandidate?: ParetoScenarioItem | null;
}

export const OptimizationSummaryStrip: React.FC<OptimizationSummaryStripProps> = ({
  result,
  preferredCandidate,
}) => {
  const tradeoff = result.tradeoff_summary;
  const baseline = result.baseline_summary;

  const maxConv = tradeoff?.conversion_rate_range_percent?.[1] ?? 86.8;
  const maxRev = tradeoff?.net_revenue_range_inr?.[1] ?? 1650802;

  const baseConv = baseline?.conversion_rate_percent ?? 83.0;
  const baseRev = baseline?.net_merchant_revenue_inr ?? 1586229;

  const preferredName = preferredCandidate
    ? preferredCandidate.scenario_name?.split("(")[0]?.trim() || preferredCandidate.scenario_id
    : result.frontier_scenarios[0]
    ? result.frontier_scenarios[0].scenario_name?.split("(")[0]?.trim() || result.frontier_scenarios[0].scenario_id
    : "—";

  return (
    <div
      aria-label="Pareto Optimization Executive Summary Ribbon"
      className="rounded-lg border border-hairline bg-surface p-3.5 shadow-panel space-y-2.5"
    >
      {/* Top Meta Bar: Status and Provenance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline/60 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-indigo-50 border border-indigo-200 text-accent">
            <Award className="size-3.5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="font-semibold text-textPrimary text-xs">
              Optimizer State & Frontier Summary
            </span>
            <span className="text-textTertiary text-[11px] ml-1.5 font-mono">
              (Common Random Numbers Paired Evaluation)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-textTertiary flex-wrap">
          <span className="px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
            {result.frontier_size} Pareto-Optimal
          </span>
          <span className="px-1.5 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            {result.dominated_scenarios.length} Dominated
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border font-semibold",
              result.infeasible_candidates_count > 0
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-hairline bg-canvas text-textTertiary"
            )}
          >
            {result.infeasible_candidates_count} Infeasible
          </span>
        </div>
      </div>

      {/* 5-Metric Restrained Summary Ribbon with Hairline Dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-canvas/40 rounded-md border border-hairline/70 overflow-hidden text-xs font-mono">
        {/* Metric 1: Candidates Evaluated */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Evaluated
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums">
            {result.total_candidates_evaluated} Policies
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Full parameter grid
          </span>
        </div>

        {/* Metric 2: Feasible Candidates */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Feasible
          </span>
          <div className="text-sm font-bold text-emerald-700 tabular-nums flex items-center gap-1">
            <CheckCircle2 className="size-3 shrink-0" />
            <span>{result.feasible_candidates_count} Feasible</span>
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Passed all guardrails
          </span>
        </div>

        {/* Metric 3: Infeasible Candidates */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Infeasible
          </span>
          <div
            className={cn(
              "text-sm font-bold tabular-nums",
              result.infeasible_candidates_count > 0 ? "text-amber-700" : "text-textSecondary"
            )}
          >
            {result.infeasible_candidates_count} Pruned
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Constraint violations
          </span>
        </div>

        {/* Metric 4: Frontier Policies */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Frontier Policies
          </span>
          <div className="text-sm font-bold text-accent tabular-nums flex items-center gap-1">
            <Sparkles className="size-3 shrink-0" />
            <span>{result.frontier_size} Frontier</span>
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Peak Conv: {maxConv.toFixed(1)}% (+{(maxConv - baseConv).toFixed(1)}pp)
          </span>
        </div>

        {/* Metric 5: Preferred Operating Policy */}
        <div className="p-2.5 space-y-0.5">
          <span className="text-[10px] text-textTertiary uppercase tracking-wider block font-sans font-medium">
            Preferred Policy
          </span>
          <div className="text-sm font-bold text-textPrimary tabular-nums truncate flex items-center gap-1">
            <Compass className="size-3 shrink-0 text-accent" />
            <span className="truncate">{preferredName}</span>
          </div>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Peak Rev: ₹{maxRev.toLocaleString("en-IN", { maximumFractionDigits: 0 })} (+₹{Math.round(maxRev - baseRev).toLocaleString("en-IN")})
          </span>
        </div>
      </div>
    </div>
  );
};
