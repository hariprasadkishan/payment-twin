import React from "react";
import { ConfidenceGrade as GradeType } from "@/types/provenance";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";

export interface ConfidenceGradeProps {
  grade: GradeType;
  sampleSize?: number;
  className?: string;
}

export const ConfidenceGrade: React.FC<ConfidenceGradeProps> = ({
  grade,
  sampleSize,
  className,
}) => {
  const configs = {
    GRADE_A: {
      label: "GRADE A",
      variant: "success" as const,
      desc: "High statistical confidence (N >= 500 records). Low estimation variance.",
    },
    GRADE_B: {
      label: "GRADE B",
      variant: "cyan" as const,
      desc: "Adequate confidence (100 <= N < 500 records). Normal sensitivity applied.",
    },
    GRADE_C: {
      label: "GRADE C",
      variant: "warning" as const,
      desc: "Low sample (30 <= N < 100 records). Warnings attached to drift analyses.",
    },
    INSUFFICIENT_DATA: {
      label: "INSUFFICIENT",
      variant: "danger" as const,
      desc: "Sample size too small (N < 30). Simulation and drift testing restricted.",
    },
    UNAVAILABLE: {
      label: "UNAVAILABLE",
      variant: "neutral" as const,
      desc: "No Behavioral DNA profile established in current repository.",
    },
  };

  const cfg = configs[grade] || configs.UNAVAILABLE;

  return (
    <Tooltip content={`${cfg.desc} ${sampleSize !== undefined ? `[N = ${sampleSize}]` : ""}`}>
      <Badge variant={cfg.variant} size="md" className={className}>
        <span className="font-semibold">{cfg.label}</span>
      </Badge>
    </Tooltip>
  );
};
