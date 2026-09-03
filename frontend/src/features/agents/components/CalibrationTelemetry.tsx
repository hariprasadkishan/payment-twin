import React from "react";
import { CalibrationDiagnostics, PopulationMetadata } from "@/types/agent";
import { ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalibrationTelemetryProps {
  diagnostics: CalibrationDiagnostics;
  metadata?: PopulationMetadata | null;
  totalGenerated: number;
}

export const CalibrationTelemetry: React.FC<CalibrationTelemetryProps> = ({
  diagnostics,
  metadata,
  totalGenerated,
}) => {
  const methodMae =
    diagnostics.method_distribution_mae !== null && diagnostics.method_distribution_mae !== undefined
      ? `${(diagnostics.method_distribution_mae * 100).toFixed(2)}%`
      : "—";

  const amountError =
    diagnostics.amount_mean_error_inr !== null && diagnostics.amount_mean_error_inr !== undefined
      ? `₹${diagnostics.amount_mean_error_inr.toFixed(2)}`
      : "—";

  const retryDrift =
    diagnostics.retry_rate_drift !== null && diagnostics.retry_rate_drift !== undefined
      ? `${(diagnostics.retry_rate_drift * 100).toFixed(2)}%`
      : "—";

  const switchDrift =
    diagnostics.method_switch_drift !== null && diagnostics.method_switch_drift !== undefined
      ? `${(diagnostics.method_switch_drift * 100).toFixed(2)}%`
      : "—";

  return (
    <div className="space-y-2">
      {/* Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600" strokeWidth={1.75} />
          <h3 className="font-semibold text-textPrimary tracking-tight text-xs">
            Population Prior Calibration Telemetry
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-tight",
              diagnostics.is_calibrated
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                diagnostics.is_calibrated ? "bg-emerald-600" : "bg-amber-600"
              )}
            />
            {diagnostics.is_calibrated ? "Calibrated Prior Match" : "Statistical Drift Warning"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-textTertiary tabular-nums">
          <span>Sampled: <strong className="text-textPrimary font-medium">{totalGenerated.toLocaleString()}</strong></span>
          <span>•</span>
          <span>Seed: <strong className="text-textPrimary font-mono">{metadata?.random_seed ?? "42"}</strong></span>
          <span>•</span>
          <span>DNA Ref: <strong className="text-textSecondary font-medium">v{metadata?.source_dna_version ?? "1.0.0"}</strong></span>
        </div>
      </div>

      {/* Unified 4-Metric Strip with internal hairline dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-surface rounded-lg border border-hairline shadow-panel overflow-hidden">
        {/* Metric 1: Method MAE */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Payment Method MAE</span>
            <Activity className="size-3.5 text-accent" strokeWidth={1.75} />
          </div>
          <div className="text-base font-semibold text-textPrimary tabular-nums">{methodMae}</div>
          <span className="text-[10px] text-emerald-700 font-medium block">Tolerance ≤ 3.0%</span>
        </div>

        {/* Metric 2: Amount Mean Error */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Amount Mean Error</span>
            <Activity className="size-3.5 text-indigo-600" strokeWidth={1.75} />
          </div>
          <div className="text-base font-semibold text-textPrimary tabular-nums">{amountError}</div>
          <span className="text-[10px] text-emerald-700 font-medium block">Tolerance ≤ ₹500</span>
        </div>

        {/* Metric 3: Retry Rate Drift */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Retry Rate Drift</span>
            <Activity className="size-3.5 text-amber-600" strokeWidth={1.75} />
          </div>
          <div className="text-base font-semibold text-textPrimary tabular-nums">{retryDrift}</div>
          <span className="text-[10px] text-emerald-700 font-medium block">Tolerance ≤ 5.0%</span>
        </div>

        {/* Metric 4: Switch Drift */}
        <div className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-textTertiary">
            <span>Method Switch Drift</span>
            <Activity className="size-3.5 text-sky-600" strokeWidth={1.75} />
          </div>
          <div className="text-base font-semibold text-textPrimary tabular-nums">{switchDrift}</div>
          <span className="text-[10px] text-emerald-700 font-medium block">Tolerance ≤ 3.0%</span>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {diagnostics.warnings && diagnostics.warnings.length > 0 && (
        <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" strokeWidth={1.75} />
          <span>{diagnostics.warnings.join(" • ")}</span>
        </div>
      )}
    </div>
  );
};

