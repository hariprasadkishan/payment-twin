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
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-hairline pb-3">
      {/* Title & Product Definition */}
      <div className="space-y-0.5 max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            Pareto Optimizer
          </h1>
          <span className="text-textTertiary text-xs">•</span>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
            Multi-Objective Frontier Search
          </span>
        </div>
        <p className="text-xs text-textSecondary leading-normal">
          Search the policy frontier across competing payment outcomes. Evaluates trade-offs between conversion, net revenue, and processing fees to isolate non-dominated operating policies under Common Random Numbers (CRN).
        </p>
      </div>

      {/* Badges & Actions */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
        <ConfidenceGrade
          grade={reliabilityGrade as GradeType}
          sampleSize={baselineSampleSize}
        />
        <ProvenanceTag
          provenance={provenanceType as ProvenanceType}
          sampleSize={baselineSampleSize}
        />

        <div className="h-4 w-px bg-hairline hidden sm:block" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToWhatIf}
          className="text-xs text-textSecondary hover:text-textPrimary gap-1 shadow-none"
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
          className="shadow-sm gap-1.5"
        >
          <Sparkles className="size-3.5" />
          <span>{isOptimizing ? "Optimizing..." : `Run Optimization (${candidateCount})`}</span>
        </Button>
      </div>
    </div>
  );
};
