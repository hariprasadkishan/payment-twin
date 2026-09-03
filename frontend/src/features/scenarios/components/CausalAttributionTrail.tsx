import React from "react";
import { AttributionStep } from "@/types/scenario";
import { Sliders, Layers, TrendingUp, DollarSign, ArrowRight, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils";

interface CausalAttributionTrailProps {
  steps: AttributionStep[];
}

export const CausalAttributionTrail: React.FC<CausalAttributionTrailProps> = ({
  steps,
}) => {
  if (!steps || steps.length === 0) return null;

  const categoryIcons: Record<string, React.ElementType> = {
    DIRECT_LEVER: Sliders,
    FUNNEL_REACTION: Layers,
    CONVERSION_IMPACT: TrendingUp,
    FINANCIAL_BOTTOM_LINE: DollarSign,
  };

  const categoryPills: Record<string, { label: string; tone: string }> = {
    DIRECT_LEVER: { label: "1. Policy Intervention", tone: "bg-blue-50 text-accent border-blue-200" },
    FUNNEL_REACTION: { label: "2. Funnel Reaction", tone: "bg-purple-50 text-purple-800 border-purple-200" },
    CONVERSION_IMPACT: { label: "3. Conversion Impact", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    FINANCIAL_BOTTOM_LINE: { label: "4. Financial Settlement", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  };

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
      {/* Header & Data Honesty Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <GitCommit className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Model-Attributed Mechanism Trail (Causal Chain)
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Counterfactual Model Estimate
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Decomposes the projected delta across behavioral mechanism stages, tracing how policy adjustments propagate into checkout dynamics and financial outcomes.
          </p>
        </div>

        <span className="text-[10px] font-mono text-textTertiary">
          {steps.length} Attributed Stages
        </span>
      </div>

      {/* 4-Step Pathway Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        {steps.map((step, idx) => {
          const Icon = categoryIcons[step.category] || Sliders;
          const pill = categoryPills[step.category] || {
            label: step.category.replace(/_/g, " "),
            tone: "bg-subtle text-textSecondary border-hairline",
          };

          return (
            <div
              key={step.step_order || idx}
              className="p-3 rounded-md border border-hairline bg-canvas/40 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold border",
                      pill.tone
                    )}
                  >
                    <Icon className="size-3 shrink-0" strokeWidth={1.75} />
                    <span>{pill.label}</span>
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="size-3 text-textTertiary hidden md:block opacity-40 -mr-1" />
                  )}
                </div>

                <p className="text-xs text-textPrimary leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Quantitative Metrics Badge if present */}
              {step.quantitative_impact && Object.keys(step.quantitative_impact).length > 0 && (
                <div className="pt-1.5 border-t border-hairline/60 space-y-0.5 text-[10px] font-mono text-textSecondary">
                  {Object.entries(step.quantitative_impact).slice(0, 2).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-baseline">
                      <span className="text-textTertiary capitalize truncate">{k.replace(/_/g, " ")}:</span>
                      <span className="font-semibold text-textPrimary tabular-nums">
                        {typeof v === "number" ? v.toLocaleString() : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
