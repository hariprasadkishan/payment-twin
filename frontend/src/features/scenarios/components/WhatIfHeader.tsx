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
    <div className="space-y-2 border-b border-hairline pb-4">
      {/* Top Row: Eyebrow, Badges, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
              WHAT-IF STUDIO
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
            Counterfactual payment policy
          </h1>

          <p className="text-xs text-textSecondary max-w-2xl leading-relaxed">
            Change one payment behavior at a time and simulate the expected business impact.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToTwin}
            className="text-xs text-textSecondary hover:text-textPrimary gap-1.5 shadow-none"
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
            className="shadow-sm gap-1.5 text-xs font-medium"
          >
            <PlayCircle className="size-3.5" />
            <span>{isComparing ? "Simulating..." : "Run Counterfactual"}</span>
          </Button>
        </div>
      </div>

      {/* Subtitle / Context Bar */}
      <div className="text-[11px] text-textSecondary bg-canvas/60 border border-hairline/70 rounded px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-textPrimary">
          "What-If answers: <strong className="text-accent font-semibold">What happens if I change one payment policy?</strong>"
        </span>
        <span className="font-mono text-[10px] text-textTertiary">
          Behavioral DNA Baseline · Common Random Numbers (CRN) Seed 42 · N=1,000 Agents
        </span>
      </div>
    </div>
  );
};
