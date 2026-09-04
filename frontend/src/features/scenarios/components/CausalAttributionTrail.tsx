import React, { useState } from "react";
import { AttributionStep } from "@/types/scenario";
import { Sliders, Layers, TrendingUp, DollarSign, ArrowRight, GitCommit, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CausalAttributionTrailProps {
  steps: AttributionStep[];
}

export const CausalAttributionTrail: React.FC<CausalAttributionTrailProps> = ({
  steps,
}) => {
  const [showDetailedTrace, setShowDetailedTrace] = useState<boolean>(false);

  if (!steps || steps.length === 0) return null;

  const categoryIcons: Record<string, React.ElementType> = {
    DIRECT_LEVER: Sliders,
    FUNNEL_REACTION: Layers,
    CONVERSION_IMPACT: TrendingUp,
    FINANCIAL_BOTTOM_LINE: DollarSign,
  };

  const categoryPills: Record<string, { label: string; tone: string }> = {
    DIRECT_LEVER: { label: "1. Policy Change", tone: "bg-blue-50 text-accent border-blue-200" },
    FUNNEL_REACTION: { label: "2. Modeled Payment Behavior", tone: "bg-purple-50 text-purple-800 border-purple-200" },
    CONVERSION_IMPACT: { label: "3. Funnel Effect", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    FINANCIAL_BOTTOM_LINE: { label: "4. Business Outcome", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  };

  return (
    <section
      aria-label="Model-Attributed Mechanism Trail"
      className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5"
    >
      {/* Header & Data Honesty Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <GitCommit className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              MODEL-ATTRIBUTED MECHANISM TRAIL
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Model Attribution Estimate
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Traces the simulated pathway from <strong className="text-textPrimary font-medium">policy change → modeled payment behavior → funnel effect → business outcome</strong>.
          </p>
        </div>

        {/* Progressive Disclosure Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowDetailedTrace(!showDetailedTrace)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-textSecondary hover:text-textPrimary px-2 py-1 rounded border border-hairline bg-canvas hover:bg-subtle transition-colors"
          >
            <span>{showDetailedTrace ? "Collapse Details" : "Inspect Mechanism Details"}</span>
            {showDetailedTrace ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
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
                  {step.description
                    .replace(/\b1\s+total\s+attempts\b/gi, "1 total attempt")
                    .replace(/\b-1\s+total\s+attempts\b/gi, "-1 total attempt")
                    .replace(/\b1\s+retry\s+attempts\b/gi, "1 retry attempt")
                    .replace(/\b-1\s+retry\s+attempts\b/gi, "-1 retry attempt")
                    .replace(/\b1\s+attempts\b/gi, "1 attempt")
                    .replace(/\b-1\s+attempts\b/gi, "-1 attempt")}
                </p>
              </div>

              {/* Quantitative Impact preview */}
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

      {/* Progressive Disclosure: Detailed Attribution Matrix */}
      {showDetailedTrace && (
        <div className="p-3 rounded-md border border-hairline bg-canvas/60 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-textPrimary font-semibold text-xs border-b border-hairline pb-1.5">
            <ShieldCheck className="size-3.5 text-accent" />
            <span>Simulation Attribution Trace & Quantitative Multipliers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
            {steps.map((step, idx) => (
              <div key={idx} className="p-2 rounded bg-surface border border-hairline space-y-1">
                <span className="text-textTertiary uppercase font-bold text-[10px] block">
                  Stage {idx + 1}: {step.category}
                </span>
                {step.quantitative_impact && Object.keys(step.quantitative_impact).length > 0 ? (
                  Object.entries(step.quantitative_impact).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-[10px]">
                      <span className="text-textSecondary truncate">{key}:</span>
                      <span className="font-semibold text-textPrimary tabular-nums">{String(val)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-textTertiary text-[10px]">Standard simulation propagation</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-textTertiary leading-normal">
            Note: This trail represents an internal simulation attribution model. It decomposes the counterfactual delta into progressive mechanistic stages. It does not establish real-world observational causality.
          </p>
        </div>
      )}
    </section>
  );
};
