import React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ParetoScenarioItem, InfeasibleScenarioItem } from "@/types/optimization";
import { Award, ArrowRight, ShieldCheck, Layers, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateInspectorDrawerProps {
  candidate: ParetoScenarioItem | InfeasibleScenarioItem | null;
  baselineSummary?: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onOpenInWhatIf: (candidate: ParetoScenarioItem) => void;
}

export const CandidateInspectorDrawer: React.FC<CandidateInspectorDrawerProps> = ({
  candidate,
  baselineSummary,
  isOpen,
  onClose,
  onOpenInWhatIf,
}) => {
  if (!candidate) return null;

  const isOptimal = (candidate as ParetoScenarioItem).is_pareto_optimal;
  const isParetoItem = "objective_values" in candidate;
  const paretoItem = isParetoItem ? (candidate as ParetoScenarioItem) : null;

  const conv = paretoItem?.objective_values?.conversion_rate_percent ?? 0;
  const rev = paretoItem?.objective_values?.net_merchant_revenue_inr ?? 0;
  const fees = paretoItem?.objective_values?.total_processing_fees_inr ?? 0;

  const baseConv = baselineSummary?.conversion_rate_percent ?? 83.0;
  const baseRev = baselineSummary?.net_merchant_revenue_inr ?? 1586229;
  const baseFees = baselineSummary?.total_processing_fees_inr ?? 10492;

  const convDelta = conv - baseConv;
  const revDelta = rev - baseRev;
  const feeDelta = fees - baseFees;

  // Uncertainty bounds if available
  const convCI = paretoItem?.uncertainty_bounds?.conversion_rate_percent?.ci_95 as [number, number] | undefined;
  const revCI = paretoItem?.uncertainty_bounds?.net_merchant_revenue_inr?.ci_95 as [number, number] | undefined;

  // Clean human-readable policy summary instead of raw dictionary object string
  const formatPolicySummary = (params: Record<string, number>) => {
    const parts: string[] = [];

    if (params.card_mdr !== undefined) {
      parts.push(`${params.card_mdr.toFixed(2)}% MDR`);
    } else if (params.card_mdr_percent !== undefined) {
      parts.push(`${params.card_mdr_percent.toFixed(2)}% MDR`);
    }

    if (params.max_retries !== undefined) {
      parts.push(`${Math.round(params.max_retries)} retries`);
    }

    if (params.upi_success !== undefined) {
      parts.push(`${(params.upi_success * 100).toFixed(0)}% UPI success`);
    } else if (params.upi_success_rate !== undefined) {
      parts.push(`${(params.upi_success_rate * 100).toFixed(0)}% UPI success`);
    }

    // Catch-all for any additional parameter overrides
    Object.entries(params).forEach(([k, v]) => {
      if (["card_mdr", "card_mdr_percent", "max_retries", "upi_success", "upi_success_rate"].includes(k)) {
        return;
      }
      if (k.includes("success") || k.includes("rate")) {
        parts.push(`${(v * 100).toFixed(0)}% ${k.replace(/_/g, " ")}`);
      } else if (k.includes("mdr") || k.includes("fee")) {
        parts.push(`${v.toFixed(2)}% MDR`);
      } else if (k.includes("retries")) {
        parts.push(`${Math.round(v)} retries`);
      } else {
        parts.push(`${k.replace(/_/g, " ")}: ${v}`);
      }
    });

    return parts.join(" · ");
  };

  // Clean title without raw parameter dictionary: e.g. "Candidate #9"
  const candidateTitle = candidate.scenario_name
    ? candidate.scenario_name.split("(")[0].trim()
    : candidate.scenario_id.replace(/^cand_/, "Candidate #") || candidate.scenario_id;

  const policySummary = formatPolicySummary(candidate.parameter_values);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={candidateTitle}
      description={policySummary || (isOptimal ? "Non-Dominated Pareto-Optimal Frontier Solution" : "Dominated Operating Point Configuration")}
    >
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] text-xs font-mono">
        {/* Dominance Status Badge */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-canvas/50">
          <div className="flex items-center gap-2">
            {isOptimal ? (
              <Award className="size-4 text-accent" strokeWidth={2} />
            ) : (
              <Layers className="size-4 text-textTertiary" />
            )}
            <span className="font-semibold text-textPrimary text-xs">
              {isOptimal ? "Pareto-Efficient Frontier" : "Feasible Dominated Candidate"}
            </span>
          </div>

          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              isOptimal
                ? "bg-indigo-50 text-accent border border-indigo-200"
                : "bg-canvas text-textSecondary border border-hairline"
            )}
          >
            {isOptimal ? "Non-Dominated" : `Dominated by ${(candidate as ParetoScenarioItem).dominated_by?.length ?? 0}`}
          </span>
        </div>

        {/* 1. Policy Overrides */}
        <div className="space-y-2">
          <span className="text-[11px] font-sans uppercase font-semibold text-textSecondary flex items-center gap-1.5">
            <Sliders className="size-3.5 text-accent" />
            1. Operating Policy Parameters
          </span>
          <div className="p-3 rounded-lg border border-hairline bg-surface space-y-2">
            {Object.entries(candidate.parameter_values).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-textSecondary capitalize text-[11px]">
                  {k.replace(/_/g, " ")}:
                </span>
                <span className="font-bold text-textPrimary tabular-nums">
                  {k.includes("rate") || k.includes("success")
                    ? `${(v * 100).toFixed(1)}%`
                    : k.includes("mdr")
                    ? `${v.toFixed(2)}% MDR`
                    : `${v}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Primary Objective Outcomes */}
        {paretoItem && (
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase font-semibold text-textSecondary block">
              2. Simulated Objective Outcomes
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded border border-hairline bg-surface space-y-1">
                <span className="text-[10px] font-sans text-textTertiary block">Capture Conversion</span>
                <span className="text-sm font-bold text-textPrimary tabular-nums">{conv.toFixed(1)}%</span>
              </div>
              <div className="p-2.5 rounded border border-hairline bg-surface space-y-1">
                <span className="text-[10px] font-sans text-textTertiary block">Net Merchant Revenue</span>
                <span className="text-sm font-bold text-textPrimary tabular-nums">
                  ₹{rev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-2.5 rounded border border-hairline bg-surface space-y-1">
                <span className="text-[10px] font-sans text-textTertiary block">Gateway Processing Fees</span>
                <span className="text-sm font-bold text-textPrimary tabular-nums">
                  ₹{fees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-2.5 rounded border border-hairline bg-surface space-y-1">
                <span className="text-[10px] font-sans text-textTertiary block">Dominates Count</span>
                <span className="text-sm font-bold text-accent tabular-nums">
                  {paretoItem.dominates_count} candidates
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Trade-Off vs. Empirical Baseline */}
        {paretoItem && baselineSummary && (
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase font-semibold text-textSecondary block">
              3. Trade-Off Delta vs. Baseline Reference
            </span>
            <div className="p-3 rounded-lg border border-hairline bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-textSecondary text-[11px] font-sans">Conversion Shift:</span>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    convDelta >= 0 ? "text-emerald-700" : "text-red-700"
                  )}
                >
                  {convDelta > 0 ? "+" : ""}{convDelta.toFixed(1)} pp
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSecondary text-[11px] font-sans">Net Revenue Delta:</span>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    revDelta >= 0 ? "text-emerald-700" : "text-red-700"
                  )}
                >
                  {revDelta >= 0 ? "+₹" : "-₹"}{Math.abs(revDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSecondary text-[11px] font-sans">Processing Cost Shift:</span>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    feeDelta <= 0 ? "text-emerald-700" : "text-red-700"
                  )}
                >
                  {feeDelta > 0 ? "+₹" : "-₹"}{Math.abs(feeDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Statistical Uncertainty (95% Confidence Intervals) */}
        {(convCI || revCI) && (
          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase font-semibold text-textSecondary flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-accent" />
              4. Statistical Uncertainty (95% CI)
            </span>
            <div className="p-3 rounded-lg border border-hairline bg-canvas/40 space-y-1.5 text-[11px]">
              {convCI && (
                <div className="flex justify-between">
                  <span className="text-textTertiary font-sans">Conversion 95% CI:</span>
                  <span className="font-bold text-textPrimary tabular-nums">
                    [{convCI[0].toFixed(1)}%, {convCI[1].toFixed(1)}%]
                  </span>
                </div>
              )}
              {revCI && (
                <div className="flex justify-between">
                  <span className="text-textTertiary font-sans">Net Revenue 95% CI:</span>
                  <span className="font-bold text-textPrimary tabular-nums">
                    [₹{(revCI[0] / 1000).toFixed(0)}k, ₹{(revCI[1] / 1000).toFixed(0)}k]
                  </span>
                </div>
              )}
              <span className="text-[10px] text-textTertiary block pt-1 font-sans">
                Binomial Normal approximation & Central Limit Theorem variance bounds.
              </span>
            </div>
          </div>
        )}

        {/* 5. Provenance & Data Honesty */}
        <div className="p-3 rounded-lg border border-hairline bg-canvas/40 text-[10px] text-textTertiary font-sans space-y-1">
          <span className="font-semibold text-textSecondary uppercase block">
            Simulation Provenance & Model Honesty
          </span>
          <p>
            Operating outcomes are derived from paired discrete-event simulation runs over calibrated synthetic customer agents under Common Random Numbers (CRN). These represent model projections, not empirical production certainties.
          </p>
        </div>

        {/* Action Button: Test in What-If Studio */}
        {paretoItem && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onOpenInWhatIf(paretoItem);
                onClose();
              }}
              className="w-full gap-2 text-xs font-semibold shadow-sm"
            >
              <span>Test Operating Point in What-If Studio</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};
