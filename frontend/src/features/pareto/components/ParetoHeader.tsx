import React from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { RotateCcw, ArrowLeft, Sparkles } from "lucide-react";
import { ConfidenceGrade as GradeType, ProvenanceType } from "@/types/provenance";

interface ParetoHeaderProps {
  reliabilityGrade?: string;
  provenanceType?: string;
  baselineSampleSize?: number;
  isOptimizing: boolean;
  onRunOptimization: () => void;
  onReset: () => void;
  onBackToWhatIf: () => void;
  candidateCount: number;
}

export const ParetoHeader: React.FC<ParetoHeaderProps> = ({
  reliabilityGrade = "GRADE_A",
  provenanceType = "SYNTHETIC_BENCHMARK_DATA",
  baselineSampleSize = 650,
  isOptimizing,
  onRunOptimization,
  onReset,
  onBackToWhatIf,
  candidateCount,
}) => {
  return (
    <div className="space-y-2 border-b border-hairline pb-4">
      {/* Top Row: Eyebrow, Badges, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
              PARETO OPTIMIZER
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
            Policy frontier
          </h1>

          <p className="text-xs text-textSecondary max-w-2xl leading-relaxed">
            Explore the best trade-offs across conversion, revenue, fees, failures, and abandonment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToWhatIf}
            className="text-xs text-textSecondary hover:text-textPrimary gap-1.5 shadow-none"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to What-If</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            className="text-xs gap-1.5 shadow-xs text-textSecondary"
            title="Reset constraints and search grid to defaults"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            isLoading={isOptimizing}
            onClick={onRunOptimization}
            className="shadow-sm gap-1.5 text-xs font-medium"
          >
            <Sparkles className="size-3.5" />
            <span>{isOptimizing ? "Optimizing..." : `Run Optimization (${candidateCount})`}</span>
          </Button>
        </div>
      </div>

      {/* Subtitle / Context Bar */}
      <div className="text-[11px] text-textSecondary bg-canvas/60 border border-hairline/70 rounded px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-textPrimary">
          "Pareto answers: <strong className="text-accent font-semibold">Across many possible policies, which ones give me the best trade-offs?</strong>"
        </span>
        <span className="font-mono text-[10px] text-textTertiary">
          Common Random Numbers (CRN) Paired · 3×3×3 Discrete Search Grid ({candidateCount} Candidates)
        </span>
      </div>
    </div>
  );
};
