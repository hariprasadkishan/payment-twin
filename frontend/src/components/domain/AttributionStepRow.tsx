import React from "react";
import { CheckCircle, Sliders, Layers, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttributionStepData {
  tier: "DIRECT_LEVER" | "FUNNEL_REACTION" | "CONVERSION_IMPACT" | "FINANCIAL_BOTTOM_LINE";
  title: string;
  description: string;
  metricDelta?: string;
  isPositive?: boolean;
}

export interface AttributionStepRowProps {
  steps: AttributionStepData[];
  className?: string;
}

export const AttributionStepRow: React.FC<AttributionStepRowProps> = ({ steps, className }) => {
  const tierIcons = {
    DIRECT_LEVER: Sliders,
    FUNNEL_REACTION: Layers,
    CONVERSION_IMPACT: TrendingUp,
    FINANCIAL_BOTTOM_LINE: DollarSign,
  };

  const tierColors = {
    DIRECT_LEVER: "border-twin-cyan/30 text-twin-cyan bg-twin-cyan/10",
    FUNNEL_REACTION: "border-twin-indigo/30 text-twin-indigo bg-twin-indigo/10",
    CONVERSION_IMPACT: "border-twin-success/30 text-twin-success bg-twin-success/10",
    FINANCIAL_BOTTOM_LINE: "border-twin-warning/30 text-twin-warning bg-twin-warning/10",
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-3 relative", className)}>
      {steps.map((step, idx) => {
        const Icon = tierIcons[step.tier] || CheckCircle;
        const colorClass = tierColors[step.tier] || "border-twin-border text-twin-slate bg-twin-card";

        return (
          <div
            key={step.tier}
            className="p-4 rounded-xl border border-twin-border bg-twin-card/40 flex flex-col justify-between space-y-3 relative group hover:border-twin-cyan/40 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("p-1.5 rounded-lg border", colorClass)}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono text-twin-slate uppercase tracking-wider">
                  Step {idx + 1}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-twin-white tracking-tight">{step.title}</h4>
              <p className="text-[11px] text-twin-slate leading-relaxed">{step.description}</p>
            </div>

            {step.metricDelta && (
              <div className="pt-2 border-t border-twin-border/40 text-xs font-mono font-bold text-twin-cyan">
                {step.metricDelta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
