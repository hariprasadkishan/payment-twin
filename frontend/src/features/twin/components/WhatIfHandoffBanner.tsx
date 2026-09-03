import React from "react";
import { Button } from "@/components/ui/Button";
import { FlaskConical, ArrowRight } from "lucide-react";

interface WhatIfHandoffBannerProps {
  topBottleneck: string;
  bottleneckCount: number;
  bottleneckPercent: number;
  onHandoffToWhatIf: () => void;
}

export const WhatIfHandoffBanner: React.FC<WhatIfHandoffBannerProps> = ({
  topBottleneck,
  bottleneckCount,
  bottleneckPercent,
  onHandoffToWhatIf,
}) => {
  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 shadow-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Baseline Established — Test Counterfactuals in What-If Studio
            </h3>
            <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              What-If Handoff
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed">
            Simulation isolated <strong className="text-textPrimary font-semibold">{topBottleneck.replace(/_/g, " ")}</strong> ({bottleneckCount.toLocaleString()} agents / {bottleneckPercent}%) as the primary conversion bottleneck. Explore counterfactual routing shifts, dynamic retries, and gateway failovers under Common Random Numbers (CRN).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onHandoffToWhatIf}
          className="whitespace-nowrap self-start sm:self-center shadow-sm gap-1.5 text-xs font-semibold"
        >
          <span>What-If Studio</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </section>
  );
};
