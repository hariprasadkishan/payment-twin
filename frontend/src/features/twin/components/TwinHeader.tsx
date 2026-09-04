import React from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { PlayCircle, FlaskConical, Layers } from "lucide-react";
import { ConfidenceGrade as GradeType, ProvenanceType } from "@/types/provenance";

interface TwinHeaderProps {
  reliabilityGrade?: string;
  provenanceType?: string;
  baselineSampleSize?: number;
  isSimulating: boolean;
  onRunSimulation: () => void;
  hasResult: boolean;
  onHandoffToWhatIf?: () => void;
  onShowIntro?: () => void;
  isShowingIntro?: boolean;
}

export const TwinHeader: React.FC<TwinHeaderProps> = ({
  reliabilityGrade = "GRADE_A",
  provenanceType = "SYNTHETIC_BENCHMARK_DATA",
  baselineSampleSize = 650,
  isSimulating,
  onRunSimulation,
  hasResult,
  onHandoffToWhatIf,
  onShowIntro,
  isShowingIntro = false,
}) => {
  return (
    <div className="space-y-2 border-b border-hairline pb-4">
      {/* Top Eyebrow & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
              PAYMENT TWIN · COUNTERFACTUAL SIMULATION
            </span>
            <span className="text-textTertiary text-xs">•</span>
            <ConfidenceGrade
              grade={reliabilityGrade as GradeType}
              sampleSize={baselineSampleSize}
            />
            <ProvenanceTag
              provenance={provenanceType as ProvenanceType}
              sampleSize={baselineSampleSize}
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Payment Twin
          </h1>

          <p className="text-xs text-textSecondary max-w-3xl leading-relaxed">
            Simulate how calibrated customer behaviour responds to payment policies before changing the live experience. Autonomous agents traverse the simulated checkout funnel under empirical behavioral priors.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
          {onShowIntro && (
            <button
              type="button"
              onClick={onShowIntro}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-hairline bg-surface hover:bg-canvas text-textSecondary hover:text-textPrimary transition-colors shadow-xs"
              title="Toggle Intelligence Pipeline Diagram"
            >
              <Layers className="size-3.5 text-accent" />
              <span>{isShowingIntro ? "Hide Architecture" : "Pipeline Architecture"}</span>
            </button>
          )}

          {hasResult && onHandoffToWhatIf && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onHandoffToWhatIf}
              className="text-xs gap-1.5 shadow-xs"
              title="Export baseline simulation to What-If Studio"
            >
              <FlaskConical className="size-3.5 text-accent" />
              <span>Launch What-If Studio →</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            isLoading={isSimulating}
            onClick={onRunSimulation}
            className="shadow-sm gap-1.5 text-xs font-medium"
          >
            <PlayCircle className="size-3.5" />
            <span>{isSimulating ? "Simulating Funnel..." : "Run Simulation"}</span>
          </Button>
        </div>
      </div>

      {/* Core Product Line / Thesis Banner */}
      <div className="text-[11px] text-textSecondary bg-canvas/60 border border-hairline/70 rounded px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-textPrimary">
          "Razorpay shows what happened. <strong className="text-accent font-semibold">Payment Twin simulates what could happen.</strong>"
        </span>
        <span className="font-mono text-[10px] text-textTertiary">
          DNA v1.0.0 · Calibrated N=1,000 Agents · Deterministic PRNG Seed 42
        </span>
      </div>
    </div>
  );
};
