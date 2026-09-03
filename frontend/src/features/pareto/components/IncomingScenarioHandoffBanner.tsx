import React from "react";
import { ScenarioParetoHandoff } from "@/types/handoff";
import { Scale, X } from "lucide-react";

interface IncomingScenarioHandoffBannerProps {
  handoff: ScenarioParetoHandoff | null;
  onDismiss: () => void;
}

export const IncomingScenarioHandoffBanner: React.FC<IncomingScenarioHandoffBannerProps> = ({
  handoff,
  onDismiss,
}) => {
  if (!handoff) return null;

  return (
    <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <Scale className="size-4 text-accent shrink-0" strokeWidth={1.75} />
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
            <span>What-If Studio Counterfactual Context Loaded:</span>
            <span className="uppercase text-accent font-mono">
              {handoff.scenario_name}
            </span>
          </div>
          <p className="text-[11px] text-textSecondary font-mono tabular-nums">
            Intervention: <strong className="text-textPrimary font-semibold">{handoff.target_intervention}</strong> • Projected Conversion Lift: <strong className="text-emerald-700 font-semibold">+{handoff.conversion_lift_percent.toFixed(1)} pp</strong> • Revenue Delta: <strong className="text-textPrimary font-semibold">+₹{handoff.revenue_lift_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong> • Evaluate whether this candidate operating point lies on the non-dominated Pareto frontier below.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-textTertiary hover:text-textPrimary flex items-center gap-1 self-end sm:self-center font-medium p-1 rounded hover:bg-indigo-100/50 transition-colors"
      >
        <X className="size-3.5" />
        <span>Dismiss</span>
      </button>
    </div>
  );
};
