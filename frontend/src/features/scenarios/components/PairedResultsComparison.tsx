import React from "react";
import { ScenarioComparison } from "@/types/scenario";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PairedResultsComparisonProps {
  comparison: ScenarioComparison;
  populationSize: number;
}

export const PairedResultsComparison: React.FC<PairedResultsComparisonProps> = ({
  comparison,
  populationSize,
}) => {
  const metrics = comparison.metric_comparisons;

  // Format helpers
  const formatVal = (mKey: string, val: number) => {
    if (mKey.includes("rate") || mKey.includes("percent")) return `${val.toFixed(1)}%`;
    if (mKey.includes("volume") || mKey.includes("revenue") || mKey.includes("fee") || mKey.includes("tax") || mKey.includes("ticket")) {
      return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    if (mKey.includes("attempts_per_success")) return `${val.toFixed(2)}x`;
    return val.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  };

  const formatDelta = (mKey: string, abs: number) => {
    if (abs === 0) {
      if (mKey.includes("rate") || mKey.includes("percent")) return "0.0 pp";
      if (mKey.includes("volume") || mKey.includes("revenue") || mKey.includes("fee") || mKey.includes("tax") || mKey.includes("ticket")) {
        return "₹0";
      }
      return "0";
    }

    const sign = abs > 0 ? "+" : "-";
    const absVal = Math.abs(abs);

    if (mKey.includes("rate") || mKey.includes("percent")) {
      return `${sign}${absVal.toFixed(1)} pp`;
    }
    if (mKey.includes("volume") || mKey.includes("revenue") || mKey.includes("fee") || mKey.includes("tax") || mKey.includes("ticket")) {
      return `${sign}₹${absVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    if (mKey.includes("attempts_per_success")) {
      return `${sign}${absVal.toFixed(2)}x`;
    }
    return `${sign}${absVal.toFixed(0)}`;
  };

  // Determine if a delta is commercially favorable
  const isFavorable = (mKey: string, abs: number) => {
    if (abs === 0) return null;
    // Lower failure, abandonment, fees, or attempts is favorable
    if (
      mKey.includes("failure") ||
      mKey.includes("abandonment") ||
      mKey.includes("fee") ||
      mKey.includes("tax") ||
      mKey.includes("lost_volume") ||
      mKey.includes("attempts_per_success")
    ) {
      return abs < 0;
    }
    // Higher conversion, revenue, captured volume, successful orders is favorable
    return abs > 0;
  };

  const convComp = metrics["conversion_rate_percent"];
  const revComp = metrics["net_merchant_revenue_inr"];

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
              Paired Simulation Results (Baseline vs Counterfactual)
            </h2>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary font-mono">
              CRN Isolated Variance
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Mathematical delta across identical pseudo-random seeds; paired simulation isolates the modelled intervention effect.
          </p>
        </div>

        <span className="text-[10px] font-mono text-textTertiary tabular-nums">
          N = {populationSize.toLocaleString()} Paired Customer Agents
        </span>
      </div>

      {/* 2 Dominant Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Dominant 1: Conversion Lift */}
        {convComp && (
          <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-textSecondary uppercase tracking-wider text-[11px]">
                Net Conversion Lift
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                  convComp.absolute_delta >= 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-700 bg-red-50 border-red-200"
                )}
              >
                {convComp.absolute_delta > 0 ? "+" : ""}{convComp.absolute_delta.toFixed(1)} pp Delta
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold font-mono text-textPrimary tabular-nums">
                {convComp.scenario_value.toFixed(1)}%
              </span>
              <div className="text-xs text-textSecondary font-mono flex items-center gap-1.5">
                <span>Baseline: {convComp.baseline_value.toFixed(1)}%</span>
                <ArrowRight className="size-3 text-textTertiary" />
                <span className="font-semibold text-textPrimary">{convComp.scenario_value.toFixed(1)}%</span>
              </div>
            </div>

            <p className="text-[10px] text-textTertiary leading-normal">
              {convComp.percentage_delta !== null && convComp.percentage_delta !== undefined && (
                <>Relative shift of {convComp.percentage_delta > 0 ? "+" : ""}{convComp.percentage_delta.toFixed(2)}% over empirical baseline.</>
              )}
            </p>
          </div>
        )}

        {/* Dominant 2: Revenue Delta */}
        {revComp && (
          <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-textSecondary uppercase tracking-wider text-[11px]">
                Net Merchant Revenue Delta
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                  revComp.absolute_delta >= 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-700 bg-red-50 border-red-200"
                )}
              >
                {revComp.absolute_delta >= 0 ? "+₹" : "-₹"}
                {Math.abs(revComp.absolute_delta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold font-mono text-textPrimary tabular-nums">
                ₹{revComp.scenario_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <div className="text-xs text-textSecondary font-mono flex items-center gap-1.5">
                <span>Baseline: ₹{revComp.baseline_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                <ArrowRight className="size-3 text-textTertiary" />
                <span className="font-semibold text-textPrimary">₹{revComp.scenario_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <p className="text-[10px] text-textTertiary leading-normal">
              {revComp.percentage_delta !== null && revComp.percentage_delta !== undefined && (
                <>{revComp.percentage_delta >= 0 ? "+" : ""}{revComp.percentage_delta.toFixed(2)}% net bottom-line proceeds after deducting gateway fees.</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Primary Comparative Operational Table */}
      <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas/50">
              <TableHead className="w-48">Financial & Operational Metric</TableHead>
              <TableHead className="text-right w-32">Baseline Prior</TableHead>
              <TableHead className="text-right w-36">Counterfactual</TableHead>
              <TableHead className="text-right w-36">Absolute Shift (Δ)</TableHead>
              <TableHead className="text-right w-28">Relative (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(metrics).map(([mKey, comp]) => {
              const favorable = isFavorable(mKey, comp.absolute_delta);
              const isNeutral = comp.absolute_delta === 0;

              return (
                <TableRow key={mKey} className="hover:bg-subtle/40 transition-colors">
                  {/* Metric Name */}
                  <TableCell className="font-medium text-xs text-textPrimary py-2">
                    <span className="capitalize block">
                      {mKey.replace(/_/g, " ").replace("percent", "%").replace("inr", "(₹)")}
                    </span>
                  </TableCell>

                  {/* Baseline Value */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2">
                    {formatVal(mKey, comp.baseline_value)}
                  </TableCell>

                  {/* Counterfactual Value */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-semibold text-textPrimary py-2">
                    {formatVal(mKey, comp.scenario_value)}
                  </TableCell>

                  {/* Absolute Delta with contextual color badge */}
                  <TableCell className="text-right py-2">
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold tabular-nums",
                        isNeutral
                          ? "text-textTertiary bg-canvas border border-hairline/60"
                          : favorable
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                          : "text-red-700 bg-red-50 border border-red-200"
                      )}
                    >
                      {formatDelta(mKey, comp.absolute_delta)}
                    </span>
                  </TableCell>

                  {/* Relative Percentage Shift */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textTertiary py-2">
                    {comp.percentage_delta !== null && comp.percentage_delta !== undefined
                      ? `${(comp.percentage_delta > 0 ? "+" : "")}${(comp.percentage_delta ?? 0).toFixed(2)}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
