import React from "react";
import { ScenarioComparison } from "@/types/scenario";
import { Button } from "@/components/ui/Button";
import { Compass, ArrowRight } from "lucide-react";

interface DecisionSummaryCardProps {
  comparison: ScenarioComparison;
  onHandoffToPareto: () => void;
}

export const DecisionSummaryCard: React.FC<DecisionSummaryCardProps> = ({
  comparison,
  onHandoffToPareto,
}) => {
  const convComp = comparison.metric_comparisons["conversion_rate_percent"];
  const revComp = comparison.metric_comparisons["net_merchant_revenue_inr"];
  const feeComp = comparison.metric_comparisons["total_processing_fees_inr"];

  const convDelta = convComp?.absolute_delta ?? 0;
  const revDelta = revComp?.absolute_delta ?? 0;
  const feeDelta = feeComp?.absolute_delta ?? 0;

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 shadow-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Counterfactual Decision Synthesis & Pareto Evaluation
            </h3>
            <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Pareto Frontier Handoff
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            Model projects a <strong className="text-textPrimary font-semibold">{convDelta >= 0 ? "+" : ""}{convDelta.toFixed(1)} pp</strong> conversion shift and <strong className="text-textPrimary font-semibold">{revDelta >= 0 ? "+₹" : "-₹"}{Math.abs(revDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong> net revenue delta (with {feeDelta > 0 ? "+₹" : "-₹"}{Math.abs(feeDelta).toFixed(0)} fee impact). Evaluate whether this operating policy lies on the multi-objective Pareto Frontier across competing merchant trade-offs.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onHandoffToPareto}
          className="whitespace-nowrap self-start sm:self-center shadow-sm gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90"
        >
          <span>Evaluate in Pareto</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {/* 3 Decision Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-200/60 text-xs font-mono">
        <div className="p-2 rounded bg-surface/80 border border-hairline space-y-0.5">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            Primary Lever
          </span>
          <span className="font-semibold text-textPrimary text-xs block">
            Policy Intervention
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            {comparison.attribution_trail?.[0]?.description || "Policy intervention applied"}
          </span>
        </div>

        <div className="p-2 rounded bg-surface/80 border border-hairline space-y-0.5">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            Economic Trade-Off
          </span>
          <span className="font-semibold text-textPrimary text-xs block">
            {feeDelta > 0 ? `+₹${feeDelta.toFixed(0)} Interchange Cost` : `-₹${Math.abs(feeDelta).toFixed(0)} Cost Reduction`}
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            MDR fee impact on bottom line
          </span>
        </div>

        <div className="p-2 rounded bg-surface/80 border border-hairline space-y-0.5">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            Recommended Action
          </span>
          <span className="font-semibold text-accent text-xs block">
            Pareto Optimization
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            Search optimal frontier across 200+ operating points
          </span>
        </div>
      </div>
    </section>
  );
};
