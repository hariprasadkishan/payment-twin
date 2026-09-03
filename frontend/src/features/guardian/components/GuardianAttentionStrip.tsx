import React from "react";
import { ShieldAlert, ShieldCheck, Clock, CheckCircle2, Sliders } from "lucide-react";
import { GuardianAlert } from "@/types/guardian";
import { cn } from "@/lib/utils";

interface GuardianAttentionStripProps {
  alerts: GuardianAlert[];
  baselineSampleSize: number;
  lastAnalysisTimestamp?: string | null;
  reliabilityGrade?: string;
}

export const GuardianAttentionStrip: React.FC<GuardianAttentionStripProps> = ({
  alerts,
  baselineSampleSize,
  lastAnalysisTimestamp,
  reliabilityGrade = "GRADE_A",
}) => {
  const openAlerts = alerts.filter((a) => a.status === "OPEN");
  const ackAlerts = alerts.filter((a) => a.status === "ACKNOWLEDGED");
  const resolvedAlerts = alerts.filter((a) => a.status === "RESOLVED" || a.status === "RECOVERED");
  const hasActiveAnomalies = openAlerts.length > 0;

  const formattedTime = lastAnalysisTimestamp
    ? new Date(lastAnalysisTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Standby";

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {hasActiveAnomalies ? (
            <ShieldAlert className="size-4 text-amber-600" strokeWidth={1.75} />
          ) : (
            <ShieldCheck className="size-4 text-emerald-600" strokeWidth={1.75} />
          )}
          <h2 className="font-semibold text-textPrimary tracking-tight text-xs">
            Sentinel Surveillance Health
          </h2>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-tight",
              hasActiveAnomalies
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                hasActiveAnomalies ? "bg-amber-600" : "bg-emerald-600"
              )}
            />
            {hasActiveAnomalies ? `${openAlerts.length} Anomaly Requiring Attention` : "Telemetry Nominal"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-textTertiary tabular-nums">
          <span>Evaluated: <strong className="text-textPrimary font-medium">{formattedTime}</strong></span>
          <span>•</span>
          <span>DNA Grade: <strong className="text-textPrimary font-medium">{reliabilityGrade.replace(/_/g, " ")}</strong></span>
          <span>•</span>
          <span>Baseline: <strong className="text-textSecondary font-medium">{baselineSampleSize.toLocaleString()} records</strong></span>
        </div>
      </div>

      {/* Unified 4-Metric Strip with internal hairline dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-surface rounded-lg border border-hairline shadow-panel overflow-hidden">
        {/* Metric 1: Open Anomalies */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Open Anomalies</span>
            <ShieldAlert
              className={cn("size-3.5", openAlerts.length > 0 ? "text-amber-600" : "text-textTertiary")}
              strokeWidth={1.75}
            />
          </div>
          <div
            className={cn(
              "text-lg font-semibold tabular-nums",
              openAlerts.length > 0 ? "text-amber-700" : "text-textPrimary"
            )}
          >
            {openAlerts.length}
          </div>
          <span className="text-[10px] text-textTertiary font-medium block">
            {openAlerts.length > 0 ? "Unacknowledged triage required" : "Zero open alerts"}
          </span>
        </div>

        {/* Metric 2: In-Triage / Acknowledged */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Acknowledged</span>
            <Clock className="size-3.5 text-accent" strokeWidth={1.75} />
          </div>
          <div className="text-lg font-semibold text-textPrimary tabular-nums">
            {ackAlerts.length}
          </div>
          <span className="text-[10px] text-textTertiary font-medium block">
            Under active investigation
          </span>
        </div>

        {/* Metric 3: Resolved / Recovered */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Resolved / Recovered</span>
            <CheckCircle2 className="size-3.5 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="text-lg font-semibold text-textPrimary tabular-nums">
            {resolvedAlerts.length}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block">
            Returned to baseline priors
          </span>
        </div>

        {/* Metric 4: Dual-Gate Methodology */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Dual Significance Gate</span>
            <Sliders className="size-3.5 text-indigo-600" strokeWidth={1.75} />
          </div>
          <div className="text-sm font-semibold text-textPrimary">
            FDR α = 0.05
          </div>
          <span className="text-[10px] text-textSecondary font-medium block">
            BH Multi-Testing + Min Effect Size
          </span>
        </div>
      </div>
    </div>
  );
};
