import React from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { RefreshCw } from "lucide-react";
import { ConfidenceGrade as GradeType, ProvenanceType } from "@/types/provenance";

interface GuardianHeaderProps {
  guardianAvailable: boolean;
  reliabilityGrade?: string;
  provenanceType?: string;
  baselineSampleSize?: number;
  lastAnalysisTimestamp?: string | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export const GuardianHeader: React.FC<GuardianHeaderProps> = ({
  guardianAvailable,
  reliabilityGrade = "GRADE_A",
  provenanceType = "SYNTHETIC_BENCHMARK_DATA",
  baselineSampleSize = 650,
  lastAnalysisTimestamp,
  isAnalyzing,
  onRunAnalysis,
}) => {
  const formattedTimestamp = lastAnalysisTimestamp
    ? new Date(lastAnalysisTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-hairline pb-3">
      {/* Title & Product Purpose */}
      <div className="space-y-0.5 max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            Payment Guardian
          </h1>
          <span className="text-textTertiary text-xs">•</span>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
            Statistical Drift Surveillance
          </span>
        </div>
        <p className="text-xs text-textSecondary leading-normal">
          Statistical monitoring comparing sliding windows of merchant payment telemetry against Behavioral DNA baseline priors to detect significant shifts in capture rates, payment method mix, and bank declines.
        </p>
      </div>

      {/* Provenance Badges & Analysis Trigger */}
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

        {formattedTimestamp && (
          <span className="text-[10px] text-textTertiary tabular-nums hidden xl:inline">
            Last: {formattedTimestamp}
          </span>
        )}

        <Button
          variant="primary"
          size="sm"
          isLoading={isAnalyzing}
          disabled={!guardianAvailable}
          onClick={onRunAnalysis}
          className="shadow-sm gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          <span>Run Surveillance</span>
        </Button>
      </div>
    </div>
  );
};
