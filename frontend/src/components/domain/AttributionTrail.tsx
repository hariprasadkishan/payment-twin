import React from "react";
import { AttributionStep } from "@/types/scenario";
import { AttributionStepRow, AttributionStepData } from "./AttributionStepRow";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { GitCommit } from "lucide-react";

export interface AttributionTrailProps {
  steps: AttributionStep[];
  className?: string;
}

export const AttributionTrail: React.FC<AttributionTrailProps> = ({
  steps,
  className = "",
}) => {
  if (!steps || steps.length === 0) return null;

  // Transform backend AttributionStep[] into AttributionStepData[] for AttributionStepRow
  const mappedSteps: AttributionStepData[] = steps.map((s) => {
    let tier: AttributionStepData["tier"] = "DIRECT_LEVER";
    if (s.category === "FUNNEL_REACTION") tier = "FUNNEL_REACTION";
    else if (s.category === "CONVERSION_IMPACT") tier = "CONVERSION_IMPACT";
    else if (s.category === "FINANCIAL_BOTTOM_LINE") tier = "FINANCIAL_BOTTOM_LINE";

    // Extract quantitative delta summary if available
    let deltaSummary = "";
    let isPositive: boolean | undefined = undefined;
    if (s.quantitative_impact) {
      const entries = Object.entries(s.quantitative_impact);
      if (entries.length > 0) {
        const [k, v] = entries[0];
        deltaSummary = `${k.replace(/_/g, " ")}: ${v}`;
        if (typeof v === "number") {
          isPositive = v >= 0;
        }
      }
    }

    return {
      tier,
      title: `Step ${s.step_order}: ${s.category.replace(/_/g, " ")}`,
      description: s.description,
      metricDelta: deltaSummary || undefined,
      isPositive,
    };
  });

  return (
    <Card variant="primary" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitCommit className="w-4 h-4 text-twin-cyan" />
          Causal Attribution Chain (Mechanism Decomposition)
        </CardTitle>
        <CardDescription>
          Transparent, deterministic explanation of downstream effects from the applied intervention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AttributionStepRow steps={mappedSteps} />
      </CardContent>
    </Card>
  );
};
