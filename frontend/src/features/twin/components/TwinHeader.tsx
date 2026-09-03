import React from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { PlayCircle, FlaskConical } from "lucide-react";
import { ConfidenceGrade as GradeType, ProvenanceType } from "@/types/provenance";

interface TwinHeaderProps {
  reliabilityGrade?: string;
  provenanceType?: string;
  baselineSampleSize?: number;
  isSimulating: boolean;
  onRunSimulation: () => void;
  hasResult: boolean;
  onHandoffToWhatIf?: () => void;
}

export const TwinHeader: React.FC<TwinHeaderProps> = ({
  reliabilityGrade = "GRADE_A",
  provenanceType = "SYNTHETIC_BENCHMARK_DATA",
  baselineSampleSize = 650,
  isSimulating,
  onRunSimulation,
  hasResult,
  onHandoffToWhatIf,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-hairline pb-3">
      {/* Title & Product Framing */}
      <div className="space-y-0.5 max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            Payment Twin
          </h1>
          <span className="text-textTertiary text-xs">•</span>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
            Discrete Funnel Simulator
          </span>
        </div>
        <p className="text-xs text-textSecondary leading-normal">
          Autonomous discrete-event simulation evaluating synthetic customer agent populations through the payment checkout funnel to model conversion economics, friction drop-offs, and retry persistence.
        </p>
      </div>

      {/* Provenance Badges & Simulation Action */}
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

        {hasResult && onHandoffToWhatIf && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onHandoffToWhatIf}
            className="text-xs gap-1.5 shadow-xs"
            title="Export baseline simulation to What-If Studio"
          >
            <FlaskConical className="size-3.5 text-accent" />
            <span>What-If Studio →</span>
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          isLoading={isSimulating}
          onClick={onRunSimulation}
          className="shadow-sm gap-1.5"
        >
          <PlayCircle className="size-3.5" />
          <span>{isSimulating ? "Simulating..." : "Run Simulation"}</span>
        </Button>
      </div>
    </div>
  );
};
