import React from "react";
import { ScenarioComparison } from "@/types/scenario";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
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
    if (
      mKey.includes("volume") ||
      mKey.includes("revenue") ||
      mKey.includes("fee") ||
      mKey.includes("tax") ||
      mKey.includes("ticket")
    ) {
      return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    if (mKey.includes("attempts_per_success")) return `${val.toFixed(2)}x`;
    return val.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  };

  const formatDelta = (mKey: string, abs: number) => {
    if (abs === 0) {
      if (mKey.includes("rate") || mKey.includes("percent")) return "0.0 pp";
      if (
        mKey.includes("volume") ||
        mKey.includes("revenue") ||
        mKey.includes("fee") ||
        mKey.includes("tax") ||
        mKey.includes("ticket")
      ) {
        return "₹0";
      }
      return "0";
    }

    const sign = abs > 0 ? "+" : "-";
    const absVal = Math.abs(abs);

    if (mKey.includes("rate") || mKey.includes("percent")) {
      return `${sign}${absVal.toFixed(1)} pp`;
    }
    if (
      mKey.includes("volume") ||
      mKey.includes("revenue") ||
      mKey.includes("fee") ||
      mKey.includes("tax") ||
      mKey.includes("ticket")
    ) {
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
  const feeComp = metrics["total_processing_fees_inr"];
  const attemptsComp = metrics["total_payment_attempts"];

  // Calculated captured orders delta
  const ordersDelta = convComp
    ? Math.round((convComp.scenario_value - convComp.baseline_value) * (populationSize / 100))
    : 0;

  return (
    <section
      aria-label="What-If Paired Simulation Executive Results & Comparison"
      className="space-y-4"
    >
      {/* ========================================================================= */}
      {/* SECTION 4: DOMINANT ANALYTICAL SURFACE — EXECUTIVE OUTCOME RIBBON         */}
      {/* ========================================================================= */}
      <div className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-hairline">
          {/* Dominant Primary Metric: Net Revenue Delta (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-canvas/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
                EXECUTIVE OUTCOME DELTA
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
                CRN Isolated Lift
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight",
                  revComp && revComp.absolute_delta >= 0
                    ? "text-semantic-success"
                    : "text-semantic-error"
                )}
              >
                {revComp
                  ? `${revComp.absolute_delta >= 0 ? "+" : "-"}₹${Math.abs(revComp.absolute_delta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                  : "—"}
              </span>
              <span className="text-xs text-textSecondary font-mono font-medium">
                net revenue
              </span>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed">
              {revComp ? (
                <>
                  Projected net bottom-line shift of{" "}
                  <strong className="text-textPrimary font-semibold">
                    {revComp.percentage_delta !== null && revComp.percentage_delta !== undefined
                      ? `${revComp.percentage_delta >= 0 ? "+" : ""}${revComp.percentage_delta.toFixed(2)}%`
                      : ""}
                  </strong>{" "}
                  over baseline (₹{revComp.baseline_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} → ₹{revComp.scenario_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}).
                </>
              ) : (
                "Net merchant revenue after deducting acquirer processing fees."
              )}
            </p>
          </div>

          {/* 4 Supporting Unboxed Metrics (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-hairline">
            {/* Conversion Lift */}
            <div className="p-4 space-y-1 min-w-0">
              <span className="text-[10px] font-medium text-textTertiary uppercase tracking-wider truncate block">
                Conversion Lift
              </span>
              <p
                className={cn(
                  "text-lg font-mono font-bold tabular-nums",
                  convComp && convComp.absolute_delta >= 0
                    ? "text-semantic-success"
                    : "text-semantic-error"
                )}
              >
                {convComp ? `${convComp.absolute_delta >= 0 ? "+" : ""}${convComp.absolute_delta.toFixed(1)} pp` : "—"}
              </p>
              <span className="text-[10px] text-textTertiary font-mono truncate block">
                {convComp ? `${convComp.baseline_value.toFixed(1)}% → ${convComp.scenario_value.toFixed(1)}%` : ""}
              </span>
            </div>

            {/* Captured Orders */}
            <div className="p-4 space-y-1 min-w-0">
              <span className="text-[10px] font-medium text-textTertiary uppercase tracking-wider truncate block">
                Captured Orders
              </span>
              <p className="text-lg font-mono font-bold tabular-nums text-textPrimary">
                {ordersDelta >= 0 ? `+${ordersDelta}` : ordersDelta} orders
              </p>
              <span className="text-[10px] text-textTertiary font-mono truncate block">
                N = {populationSize.toLocaleString()} agents
              </span>
            </div>

            {/* Fee Delta (Savings) */}
            <div className="p-4 space-y-1 min-w-0">
              <span className="text-[10px] font-medium text-textTertiary uppercase tracking-wider truncate block">
                Processing Fees
              </span>
              <p
                className={cn(
                  "text-lg font-mono font-bold tabular-nums",
                  feeComp && feeComp.absolute_delta <= 0
                    ? "text-semantic-success"
                    : "text-semantic-error"
                )}
              >
                {feeComp
                  ? `${feeComp.absolute_delta <= 0 ? "-₹" : "+₹"}${Math.abs(feeComp.absolute_delta).toFixed(0)}`
                  : "—"}
              </p>
              <span className="text-[10px] text-textTertiary font-mono truncate block">
                {feeComp && feeComp.absolute_delta <= 0 ? "MDR fee savings" : "Fee increase"}
              </span>
            </div>

            {/* Friction / Retries */}
            <div className="p-4 space-y-1 min-w-0">
              <span className="text-[10px] font-medium text-textTertiary uppercase tracking-wider truncate block">
                Attempts Shift
              </span>
              <p
                className={cn(
                  "text-lg font-mono font-bold tabular-nums",
                  attemptsComp && attemptsComp.absolute_delta <= 0
                    ? "text-semantic-success"
                    : "text-textSecondary"
                )}
              >
                {attemptsComp ? `${attemptsComp.absolute_delta >= 0 ? "+" : ""}${attemptsComp.absolute_delta.toFixed(0)}` : "—"}
              </p>
              <span className="text-[10px] text-textTertiary font-mono truncate block">
                {attemptsComp && attemptsComp.absolute_delta < 0 ? "Reduced friction" : "Attempt volume"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: BASELINE VS COUNTERFACTUAL COMPARISON TABLE                    */}
      {/* ========================================================================= */}
      <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5 shadow-panel space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Baseline vs Counterfactual Comparison Matrix
            </h3>
            <p className="text-xs text-textSecondary">
              Side-by-side evaluation of all primary economic and behavioral checkout metrics.
            </p>
          </div>
          <span className="text-[10px] font-mono text-textTertiary tabular-nums">
            N = {populationSize.toLocaleString()} Paired Agents (CRN)
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <tr className="bg-canvas/50 text-[11px] font-mono text-textSecondary">
                <TableHead className="w-56 py-2.5">Financial & Operational Metric</TableHead>
                <TableHead className="text-right w-36 py-2.5">Baseline Prior</TableHead>
                <TableHead className="text-right w-36 py-2.5">Counterfactual</TableHead>
                <TableHead className="text-right w-36 py-2.5">Absolute Shift (Δ)</TableHead>
                <TableHead className="text-right w-28 py-2.5">Relative (%)</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {Object.entries(metrics).map(([mKey, comp]) => {
                const favorable = isFavorable(mKey, comp.absolute_delta);
                const isNeutral = comp.absolute_delta === 0;

                return (
                  <TableRow key={mKey} className="hover:bg-subtle/40 transition-colors">
                    {/* Metric Name */}
                    <TableCell className="font-medium text-xs text-textPrimary py-2.5">
                      <span className="capitalize block">
                        {mKey.replace(/_/g, " ").replace("percent", "%").replace("inr", "(₹)")}
                      </span>
                    </TableCell>

                    {/* Baseline Value */}
                    <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2.5">
                      {formatVal(mKey, comp.baseline_value)}
                    </TableCell>

                    {/* Counterfactual Value */}
                    <TableCell className="text-right text-xs font-mono tabular-nums font-semibold text-textPrimary py-2.5">
                      {formatVal(mKey, comp.scenario_value)}
                    </TableCell>

                    {/* Absolute Delta with contextual color badge */}
                    <TableCell className="text-right py-2.5">
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
                    <TableCell className="text-right text-xs font-mono tabular-nums text-textTertiary py-2.5">
                      {comp.percentage_delta !== null && comp.percentage_delta !== undefined
                        ? `${comp.percentage_delta > 0 ? "+" : ""}${(comp.percentage_delta ?? 0).toFixed(2)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};
