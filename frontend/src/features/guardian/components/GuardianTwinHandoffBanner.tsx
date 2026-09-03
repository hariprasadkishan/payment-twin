import React from "react";
import { Button } from "@/components/ui/Button";
import { PlayCircle, ArrowRight, Database, ShieldAlert } from "lucide-react";

interface GuardianTwinHandoffBannerProps {
  onLaunchTwin: () => void;
  activeAlertsCount: number;
}

export const GuardianTwinHandoffBanner: React.FC<GuardianTwinHandoffBannerProps> = ({
  onLaunchTwin,
  activeAlertsCount,
}) => {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <PlayCircle className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              From Anomaly Detection to Counterfactual Simulation
            </h3>
            <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Telemetry Bridge
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed">
            Razorpay shows what happened. Guardian detects what drifted. Payment Twin simulates what could happen under hypothetical counterfactual scenarios.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onLaunchTwin}
          className="whitespace-nowrap self-start sm:self-center shadow-sm"
        >
          <span>Launch Payment Twin</span>
          <ArrowRight className="size-3.5 ml-1.5" />
        </Button>
      </div>

      {/* 3-Stage Pipeline Progression Track */}
      <div className="pt-3 border-t border-hairline">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Stage 1: Behavioral DNA */}
          <div className="p-2.5 rounded bg-canvas/60 border border-hairline/80 flex items-center gap-2.5">
            <Database className="size-3.5 text-textTertiary shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">Baseline</span>
              <span className="text-xs font-medium text-textPrimary truncate block">Behavioral DNA</span>
              <span className="text-[10px] text-emerald-700 font-medium block">Empirical Priors</span>
            </div>
          </div>

          {/* Stage 2: Payment Guardian */}
          <div className="p-2.5 rounded bg-blue-50/60 border border-blue-200/80 flex items-center gap-2.5">
            <ShieldAlert className="size-3.5 text-accent shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] text-accent font-semibold block uppercase tracking-wider">Surveillance • Active</span>
              <span className="text-xs font-bold text-accent truncate block">Payment Guardian</span>
              <span className="text-[10px] text-accent/80 font-medium block tabular-nums">
                {activeAlertsCount > 0 ? `${activeAlertsCount} Anomalies Flagged` : "Nominal Telemetry"}
              </span>
            </div>
          </div>

          {/* Stage 3: Payment Twin */}
          <div className="p-2.5 rounded bg-canvas/60 border border-hairline/80 flex items-center gap-2.5">
            <PlayCircle className="size-3.5 text-textTertiary shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">Counterfactual</span>
              <span className="text-xs font-medium text-textPrimary truncate block">Payment Twin</span>
              <span className="text-[10px] text-textTertiary block">Scenario Simulator</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
