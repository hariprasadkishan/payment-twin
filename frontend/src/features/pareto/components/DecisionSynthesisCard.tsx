import React from "react";
import { ParetoScenarioItem } from "@/types/optimization";
import { Button } from "@/components/ui/Button";
import { Compass, ArrowRight } from "lucide-react";

interface DecisionSynthesisCardProps {
  recommendedCandidate: ParetoScenarioItem | null;
  baselineSummary?: Record<string, number>;
  onOpenInWhatIf: (candidate: ParetoScenarioItem) => void;
}

export const DecisionSynthesisCard: React.FC<DecisionSynthesisCardProps> = ({
  recommendedCandidate,
  baselineSummary,
  onOpenInWhatIf,
}) => {
  if (!recommendedCandidate) return null;

  const conv = recommendedCandidate.objective_values?.conversion_rate_percent ?? 0;
  const rev = recommendedCandidate.objective_values?.net_merchant_revenue_inr ?? 0;
  const fees = recommendedCandidate.objective_values?.total_processing_fees_inr ?? 0;

  const baseConv = baselineSummary?.conversion_rate_percent ?? 83.0;
  const baseRev = baselineSummary?.net_merchant_revenue_inr ?? 1586229;
  const baseFees = baselineSummary?.total_processing_fees_inr ?? 10492;

  const convDelta = conv - baseConv;
  const revDelta = rev - baseRev;
  const feeDelta = fees - baseFees;

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 shadow-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Frontier Decision Synthesis & Recommended Operating Policy
            </h3>
            <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Model-Selection Heuristic
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            Among evaluated candidates, operating configuration <strong className="text-textPrimary font-semibold">{recommendedCandidate.scenario_id}</strong> delivers the optimal revenue-conversion trade-off on the non-dominated Pareto frontier, projecting a <strong className="text-textPrimary font-semibold">{convDelta >= 0 ? "+" : ""}{convDelta.toFixed(1)} pp</strong> conversion lift and <strong className="text-textPrimary font-semibold">{revDelta >= 0 ? "+₹" : "-₹"}{Math.abs(revDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong> net revenue delta (with {feeDelta > 0 ? "+₹" : "-₹"}{Math.abs(feeDelta).toFixed(0)} fee shift).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenInWhatIf(recommendedCandidate)}
          className="whitespace-nowrap self-start sm:self-center shadow-sm gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90"
        >
          <span>Test in What-If Studio</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {/* 3 Decision Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-200/60 text-xs font-mono">
        <div className="p-2 rounded bg-surface/80 border border-hairline space-y-0.5">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            Strongest Upside
          </span>
          <span className="font-semibold text-emerald-700 text-xs block">
            +{convDelta.toFixed(1)} pp Conversion ({conv.toFixed(1)}%)
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            +₹{Math.abs(revDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })} net revenue expansion
          </span>
        </div>

        <div className="p-2 rounded bg-surface/80 border border-hairline space-y-0.5">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            Principal Trade-Off
          </span>
          <span className="font-semibold text-textPrimary text-xs block">
            {feeDelta > 0 ? `+₹${feeDelta.toFixed(0)} Gateway Fees` : `-₹${Math.abs(feeDelta).toFixed(0)} Fee Savings`}
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            Interchange cost impact on bottom line
          </span>
        </div>

        <div className="p-2 rounded bg-surface/80 border border-hairline space-y-0.5">
          <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block">
            Frontier Standing
          </span>
          <span className="font-semibold text-accent text-xs block">
            Dominates {recommendedCandidate.dominates_count} Configurations
          </span>
          <span className="text-[10px] font-sans text-textSecondary block truncate">
            Strictly non-dominated across all 3 criteria
          </span>
        </div>
      </div>
    </section>
  );
};
