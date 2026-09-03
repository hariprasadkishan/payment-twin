import React from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { RotateCcw, ArrowLeft, PlayCircle } from "lucide-react";
import { ConfidenceGrade as GradeType, ProvenanceType } from "@/types/provenance";

interface WhatIfHeaderProps {
  reliabilityGrade?: string;
  provenanceType?: string;
  baselineSampleSize?: number;
  isComparing: boolean;
  onRunScenario: () => void;
  onResetToBaseline: () => void;
  onBackToTwin: () => void;
}

export const WhatIfHeader: React.FC<WhatIfHeaderProps> = ({
  reliabilityGrade = "GRADE_A",
  provenanceType = "SYNTHETIC_BENCHMARK_DATA",
  baselineSampleSize = 650,
  isComparing,
  onRunScenario,
  onResetToBaseline,
  onBackToTwin,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-hairline pb-3">
      {/* Title & Concise Product Definition */}
      <div className="space-y-0.5 max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            What-If Studio
          </h1>
          <span className="text-textTertiary text-xs">•</span>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
            Counterfactual Laboratory
          </span>
        </div>
        <p className="text-xs text-textSecondary leading-normal">
          Evaluate hypothetical payment routing shifts, authorization success improvements, and retry overrides against the empirical baseline under Common Random Numbers (CRN).
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
          onClick={onBackToTwin}
          className="text-xs text-textSecondary hover:text-textPrimary gap-1 shadow-none"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Twin</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onResetToBaseline}
          className="text-xs gap-1.5 shadow-xs text-textSecondary"
          title="Reset all intervention levers back to baseline values"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          isLoading={isComparing}
          onClick={onRunScenario}
          className="shadow-sm gap-1.5"
        >
          <PlayCircle className="size-3.5" />
          <span>{isComparing ? "Simulating..." : "Run Scenario"}</span>
        </Button>
      </div>
    </div>
  );
};
