import React from "react";
import { ScenarioComparison } from "@/types/scenario";
import { Button } from "@/components/ui/Button";
import { Compass, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionSummaryCardProps {
  comparison: ScenarioComparison;
  onHandoffToPareto: () => void;
  onBackToTwin?: () => void;
}

export const DecisionSummaryCard: React.FC<DecisionSummaryCardProps> = ({
  comparison,
  onHandoffToPareto,
  onBackToTwin,
}) => {
  const convComp = comparison.metric_comparisons["conversion_rate_percent"];
  const revComp = comparison.metric_comparisons["net_merchant_revenue_inr"];
  const feeComp = comparison.metric_comparisons["total_processing_fees_inr"];

  const convDelta = convComp?.absolute_delta ?? 0;
  const revDelta = revComp?.absolute_delta ?? 0;
  const feeDelta = feeComp?.absolute_delta ?? 0;

  return (
    <section
      aria-label="Counterfactual Decision Synthesis and Action Pathways"
      className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              DECISION SYNTHESIS & PARETO FRONTIER HANDOFF
            </h3>
            <span className="inline-flex items-center rounded border border-hairline bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-textSecondary font-mono">
              Action Pathway
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            What-If verified the single-policy outcome:{" "}
            <strong className="text-textPrimary font-semibold">
              {convDelta >= 0 ? "+" : ""}{convDelta.toFixed(1)} pp conversion
            </strong>{" "}
            and{" "}
            <strong className="text-textPrimary font-semibold">
              {revDelta >= 0 ? "+₹" : "-₹"}{Math.abs(revDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })} net revenue
            </strong>{" "}
            (with {feeDelta <= 0 ? `-₹${Math.abs(feeDelta).toFixed(0)} fee savings` : `+₹${feeDelta.toFixed(0)} fee increase`}). To discover whether a superior balance exists across conflicting dimensions, execute a multi-objective frontier search in Pareto Optimizer.
          </p>
        </div>

        {/* Action Pathways: Twin and Pareto */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          {onBackToTwin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTwin}
              className="text-xs text-textSecondary hover:text-textPrimary gap-1.5 shadow-none"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Twin</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onHandoffToPareto}
            className="whitespace-nowrap shadow-sm gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90"
          >
            <span>Search Pareto Frontier</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 3 Decision Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-hairline text-xs font-mono">
        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            1. Isolated Lever
          </span>
          <span className="font-semibold text-textPrimary text-xs block">
            Counterfactual Policy
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            {comparison.attribution_trail?.[0]?.description || "Policy intervention applied"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            2. Economic Trade-Off
          </span>
          <span
            className={cn(
              "font-semibold text-xs block tabular-nums",
              feeDelta <= 0 ? "text-emerald-700" : "text-textPrimary"
            )}
          >
            {feeDelta <= 0
              ? `-₹${Math.abs(feeDelta).toFixed(0)} Gateway Fee Savings`
              : `+₹${feeDelta.toFixed(0)} Interchange Cost`}
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            {feeDelta <= 0 ? "Favorable acquirer MDR reduction" : "Additional processing cost"}
          </span>
        </div>

        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            3. Recommended Next Step
          </span>
          <span className="font-semibold text-accent text-xs block">
            Multi-Objective Pareto Search
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            Evaluate optimal trade-offs across 200+ operating points
          </span>
        </div>
      </div>
    </section>
  );
};
