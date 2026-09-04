import React from "react";
import { ParetoScenarioItem } from "@/types/optimization";
import { Button } from "@/components/ui/Button";
import { Compass, ArrowRight, ArrowLeft, Award, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionSynthesisCardProps {
  selectedCandidate: ParetoScenarioItem | null;
  recommendedCandidate: ParetoScenarioItem | null;
  baselineSummary?: Record<string, number>;
  onOpenInWhatIf: (candidate: ParetoScenarioItem) => void;
  onOpenInTwin?: () => void;
  onInspectDrawer?: (candidate: ParetoScenarioItem) => void;
}

export const DecisionSynthesisCard: React.FC<DecisionSynthesisCardProps> = ({
  selectedCandidate,
  recommendedCandidate,
  baselineSummary,
  onOpenInWhatIf,
  onOpenInTwin,
  onInspectDrawer,
}) => {
  const candidate = selectedCandidate || recommendedCandidate;
  if (!candidate) return null;

  const isPreferred = recommendedCandidate && candidate.scenario_id === recommendedCandidate.scenario_id;
  const isOptimal = candidate.is_pareto_optimal;

  const conv = candidate.objective_values?.conversion_rate_percent ?? 0;
  const rev = candidate.objective_values?.net_merchant_revenue_inr ?? 0;
  const fees = candidate.objective_values?.total_processing_fees_inr ?? 0;
  const fail = candidate.objective_values?.failure_rate_percent ?? 13.0;

  const baseConv = baselineSummary?.conversion_rate_percent ?? 83.0;
  const baseRev = baselineSummary?.net_merchant_revenue_inr ?? 1586229;
  const baseFees = baselineSummary?.total_processing_fees_inr ?? 10492;
  const baseFail = baselineSummary?.failure_rate_percent ?? 15.5;

  const convDelta = conv - baseConv;
  const revDelta = rev - baseRev;
  const feeDelta = fees - baseFees;
  const failDelta = fail - baseFail;

  // Extract parameters in plain language
  const params = candidate.parameter_values || {};
  const cardMdr = params.card_mdr ?? params.card_mdr_percent ?? 1.20;
  const maxRetries = params.max_retries !== undefined ? Math.round(params.max_retries) : 1;
  const upiSuccess = params.upi_success ?? params.upi_success_rate ?? 0.95;

  const candidateDisplayName = candidate.scenario_name
    ? candidate.scenario_name.split("(")[0]?.trim()
    : candidate.scenario_id.replace(/^cand_/, "Candidate #") || candidate.scenario_id;

  return (
    <section
      aria-label="Selected Policy Summary & Decision Synthesis"
      className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-4"
    >
      {/* Header with Badges & Rationale */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-hairline pb-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Compass className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
              SELECTED POLICY · {candidateDisplayName.toUpperCase()}
            </span>
            {isPreferred && (
              <span className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                <Award className="size-2.5" />
                <span>Preferred Under Current Weighting</span>
              </span>
            )}
            {isOptimal && !isPreferred && (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <CheckCircle2 className="size-2.5" />
                <span>Pareto-Optimal Frontier</span>
              </span>
            )}
            {!isOptimal && (
              <span className="inline-flex items-center rounded border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-textSecondary">
                Dominated Candidate
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-textPrimary tracking-tight">
            {isPreferred
              ? "Preferred Operating Point on the Non-Dominated Frontier"
              : `Operating Configuration ${candidateDisplayName}`}
          </h3>

          <p className="text-xs text-textSecondary leading-relaxed">
            {isPreferred
              ? "Preferred under the current objective weighting (maximizes net merchant revenue while strictly dominating interior policies). Evaluates trade-offs across conversion lift, acquirer MDR fees, and terminal decline rates."
              : `Selected candidate configuration evaluated under Common Random Numbers (CRN). Outperforms ${candidate.dominates_count ?? 0} dominated configurations.`}
          </p>
        </div>

        {/* Action Pathways */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          {onOpenInTwin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenInTwin}
              className="text-xs text-textSecondary hover:text-textPrimary gap-1.5 shadow-none"
            >
              <ArrowLeft className="size-3.5" />
              <span>Simulate in Twin</span>
            </Button>
          )}

          {onInspectDrawer && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onInspectDrawer(candidate)}
              className="text-xs gap-1.5 shadow-xs text-textSecondary"
            >
              <FileText className="size-3" />
              <span>Inspect Traces</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenInWhatIf(candidate)}
            className="whitespace-nowrap shadow-sm gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90"
          >
            <span>Analyze in What-If Studio</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Two-Column Section: Plain-Language Policy Levers (Left) + Expected Outcomes vs Baseline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-0.5">
        {/* Left: Policy Parameters (4 cols) */}
        <div className="lg:col-span-4 p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-hairline/70 pb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-textTertiary">
              Policy Parameters
            </span>
            <span className="text-[10px] text-textTertiary">Configured Controls</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-textSecondary font-sans">Card MDR</span>
              <span className="font-bold text-textPrimary tabular-nums">
                {cardMdr.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-textSecondary font-sans">Max Retries</span>
              <span className="font-bold text-textPrimary tabular-nums">
                {maxRetries === 1 ? "1 retry" : `${maxRetries} retries`}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-textSecondary font-sans">UPI Success</span>
              <span className="font-bold text-textPrimary tabular-nums">
                {(upiSuccess * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-hairline/60 text-[10px] text-textTertiary font-sans leading-normal">
            Controllable checkout switches governing merchant routing, auth propensity, and interchange fees.
          </div>
        </div>

        {/* Right: Outcome Metrics & Baseline Comparison Matrix (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-hairline rounded-md border border-hairline bg-canvas/40 overflow-hidden font-mono text-xs">
          {/* Net Merchant Revenue */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block truncate">
              Net Revenue
            </span>
            <div className="text-base font-bold text-textPrimary tabular-nums">
              ₹{rev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  revDelta >= 0 ? "text-emerald-700" : "text-red-700"
                )}
              >
                {revDelta >= 0 ? "+₹" : "-₹"}{Math.abs(revDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-textTertiary font-sans">vs baseline</span>
            </div>
          </div>

          {/* Capture Conversion */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block truncate">
              Conversion Rate
            </span>
            <div className="text-base font-bold text-textPrimary tabular-nums">
              {conv.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  convDelta >= 0 ? "text-emerald-700" : "text-red-700"
                )}
              >
                {convDelta >= 0 ? "+" : ""}{convDelta.toFixed(1)} pp
              </span>
              <span className="text-textTertiary font-sans">vs {baseConv.toFixed(1)}%</span>
            </div>
          </div>

          {/* Processing Fees */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block truncate">
              Gateway Fees
            </span>
            <div className="text-base font-bold text-textPrimary tabular-nums">
              ₹{fees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  feeDelta <= 0 ? "text-emerald-700" : "text-textSecondary"
                )}
              >
                {feeDelta <= 0 ? "-₹" : "+₹"}{Math.abs(feeDelta).toFixed(0)}
              </span>
              <span className="text-textTertiary font-sans">{feeDelta <= 0 ? "fee savings" : "cost increase"}</span>
            </div>
          </div>

          {/* Terminal Failure */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] font-sans font-medium text-textTertiary uppercase tracking-wider block truncate">
              Failure Rate
            </span>
            <div className="text-base font-bold text-textPrimary tabular-nums">
              {fail.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  failDelta <= 0 ? "text-emerald-700" : "text-red-700"
                )}
              >
                {failDelta <= 0 ? "" : "+"}{failDelta.toFixed(1)} pp
              </span>
              <span className="text-textTertiary font-sans">vs {baseFail.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
