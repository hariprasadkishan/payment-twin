import React, { useState } from "react";
import { DetectorResult } from "@/types/guardian";
import { ArrowDownRight, ArrowUpRight, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardianDeviationSurfaceProps {
  detectorResults: DetectorResult[];
  onSelectDetector?: (detector: DetectorResult) => void;
}

const DETECTOR_NAMES: Record<string, { label: string; category: string }> = {
  payment_method_distribution: {
    label: "Payment Method Mix Distribution",
    category: "Macro Mix",
  },
  overall_success_rate: {
    label: "Overall Capture Conversion Rate",
    category: "Funnel Conversion",
  },
  upi_success_rate: {
    label: "UPI Rail Capture Rate",
    category: "Rail Conversion",
  },
  card_success_rate: {
    label: "Card Rail Capture Rate",
    category: "Rail Conversion",
  },
  netbanking_success_rate: {
    label: "Netbanking Rail Capture Rate",
    category: "Rail Conversion",
  },
  wallet_success_rate: {
    label: "Wallet Rail Capture Rate",
    category: "Rail Conversion",
  },
  bank_hdfc_success_rate: {
    label: "HDFC Bank Route Performance",
    category: "Issuer Route",
  },
  bank_icic_success_rate: {
    label: "ICICI Bank Route Performance",
    category: "Issuer Route",
  },
  transaction_amount_distribution: {
    label: "Transaction Ticket Size (AOV) Distribution",
    category: "Economics",
  },
  sequential_failure_rate_shift: {
    label: "Sequential Failure Frequency Shift",
    category: "Sequential CUSUM",
  },
};

const formatPercent = (n?: number | null, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

const formatCurrency = (n?: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);

export const GuardianDeviationSurface: React.FC<GuardianDeviationSurfaceProps> = ({
  detectorResults,
  onSelectDetector,
}) => {
  const [viewMode, setViewMode] = useState<"matrix" | "bands">("matrix");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const categories = ["ALL", "Rail Conversion", "Issuer Route", "Macro Mix", "Economics", "Sequential CUSUM"];

  const filteredResults = detectorResults.filter((result) => {
    if (categoryFilter === "ALL") return true;
    const cat = DETECTOR_NAMES[result.metric_name]?.category || "Other";
    return cat === categoryFilter;
  });

  // Core conversion rails for the Control Bands view
  const conversionRails = detectorResults.filter((r) =>
    [
      "overall_success_rate",
      "upi_success_rate",
      "card_success_rate",
      "netbanking_success_rate",
      "wallet_success_rate",
    ].includes(r.metric_name)
  );

  return (
    <section
      aria-label="Dominant Guardian Statistical Deviation Monitor"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-textPrimary tracking-tight">
              Statistical Deviation Monitor & Drift Surveillance
            </h2>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
              Dual-Gate Telemetry (10 Detectors)
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Active surveillance comparing recent 200 transaction telemetry against learned Behavioral DNA priors.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-md border border-hairline bg-canvas p-0.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              viewMode === "matrix"
                ? "bg-surface text-textPrimary shadow-sm font-semibold"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            Deviation Matrix Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("bands")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              viewMode === "bands"
                ? "bg-surface text-textPrimary shadow-sm font-semibold"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            Control Corridor Bands
          </button>
        </div>
      </div>

      {/* Category Filter Filter Tabs */}
      {viewMode === "matrix" && (
        <div className="px-4 py-2.5 bg-canvas/40 border-b border-hairline flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-textTertiary text-[11px] font-mono shrink-0">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-2.5 py-1 rounded text-xs transition-colors shrink-0",
                categoryFilter === cat
                  ? "bg-surface font-semibold text-textPrimary border border-hairline shadow-xs"
                  : "text-textSecondary hover:text-textPrimary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* View Body */}
      {viewMode === "matrix" ? (
        /* 10-Detector High-Density Analytical Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-hairline bg-canvas/60 text-[11px] font-mono text-textSecondary">
                <th className="py-3 px-4 font-semibold">Dimension / Monitored Entity</th>
                <th className="py-3 px-4 font-semibold">Baseline</th>
                <th className="py-3 px-4 font-semibold">Observed</th>
                <th className="py-3 px-4 font-semibold">Delta</th>
                <th className="py-3 px-4 font-semibold">Statistical Test</th>
                <th className="py-3 px-4 font-semibold">P-Value (FDR)</th>
                <th className="py-3 px-4 font-semibold">Practical Effect</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredResults.map((res) => {
                const meta = DETECTOR_NAMES[res.metric_name] || {
                  label: res.metric_name.replace(/_/g, " "),
                  category: "Telemetry",
                };

                const isConversion = res.metric_name.includes("success_rate");
                const isAmount = res.metric_name.includes("amount");
                const isPsi = res.detector_type === "PSI_CATEGORICAL";
                const isCusum = res.detector_type === "CUSUM_SHIFT";

                // Format values based on metric type
                let baselineStr = "—";
                let observedStr = "—";
                let deltaStr = "—";
                const isPositiveDelta = res.absolute_delta >= 0;

                if (isConversion) {
                  baselineStr = formatPercent(res.baseline_value);
                  observedStr = formatPercent(res.observed_value);
                  deltaStr = `${isPositiveDelta ? "+" : ""}${(res.absolute_delta * 100).toFixed(1)}%`;
                } else if (isAmount) {
                  baselineStr = formatCurrency(res.baseline_value);
                  observedStr = formatCurrency(res.observed_value);
                  deltaStr = `${isPositiveDelta ? "+" : ""}${formatCurrency(res.absolute_delta)}`;
                } else if (isPsi) {
                  baselineStr = "0.000";
                  observedStr = res.observed_value.toFixed(4);
                  deltaStr = `PSI ${res.observed_value.toFixed(4)}`;
                } else if (isCusum) {
                  baselineStr = formatPercent(res.baseline_value);
                  observedStr = formatPercent(res.observed_value);
                  deltaStr = "CUSUM 0.0";
                }

                // Determine row state
                const isAnomaly = res.is_statistically_significant && res.is_practically_significant;
                const isMonitored = res.is_practically_significant && !res.is_statistically_significant;

                return (
                  <tr
                    key={res.metric_name}
                    onClick={() => onSelectDetector?.(res)}
                    className={cn(
                      "transition-colors hover:bg-canvas/50 cursor-pointer",
                      isAnomaly ? "bg-rose-50/30" : ""
                    )}
                  >
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-textPrimary block">
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-textTertiary">
                          <span>{meta.category}</span>
                          <span>•</span>
                          <span>n_base={res.sample_size_baseline} / n_obs={res.sample_size_recent}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-textSecondary font-medium">
                      {baselineStr}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary font-bold">
                      {observedStr}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.2 rounded",
                          isConversion && !isPositiveDelta
                            ? "bg-rose-50 text-semantic-error"
                            : isConversion && isPositiveDelta
                            ? "bg-emerald-50 text-semantic-success"
                            : "bg-canvas text-textSecondary"
                        )}
                      >
                        {isConversion &&
                          (!isPositiveDelta ? (
                            <ArrowDownRight className="size-3" />
                          ) : (
                            <ArrowUpRight className="size-3" />
                          ))}
                        <span>{deltaStr}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-textSecondary">
                      {res.detector_type.replace(/_/g, " ")}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-[11px] text-textSecondary">
                      {res.p_value_adjusted_fdr != null
                        ? `p = ${res.p_value_adjusted_fdr.toFixed(3)}`
                        : res.p_value_raw != null
                        ? `p = ${res.p_value_raw.toFixed(3)}`
                        : "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border",
                          res.is_practically_significant
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-canvas text-textTertiary border-hairline"
                        )}
                      >
                        {res.is_practically_significant
                          ? "Effect Threshold Reached"
                          : "Within Tolerance"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isAnomaly ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-semantic-error bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          <AlertTriangle className="size-3" />
                          <span>ANOMALY</span>
                        </span>
                      ) : isMonitored ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          <Activity className="size-3" />
                          <span>MONITORED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <ShieldCheck className="size-3" />
                          <span>STABLE</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Control Corridor Bands View */
        <div className="p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
              Capture Conversion Control Corridors (95% CI Baseline vs Observed)
            </h3>
            <p className="text-xs text-textSecondary">
              Visual evaluation of primary payment rail capture rates against their learned Behavioral DNA control corridor.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-hairline">
            {conversionRails.map((rail) => {
              const meta = DETECTOR_NAMES[rail.metric_name] || {
                label: rail.metric_name,
                category: "Rail",
              };
              const basePct = rail.baseline_value * 100;
              const obsPct = rail.observed_value * 100;
              const deltaPct = (rail.absolute_delta * 100).toFixed(1);
              const isPositive = rail.absolute_delta >= 0;

              return (
                <div key={rail.metric_name} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-textPrimary">{meta.label}</span>
                      <span className="text-[10px] font-mono text-textTertiary">
                        n_base={rail.sample_size_baseline} / n_obs={rail.sample_size_recent}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                      <span className="text-textSecondary">
                        Baseline: <strong>{formatPercent(rail.baseline_value)}</strong>
                      </span>
                      <span className="text-textPrimary">
                        Observed: <strong>{formatPercent(rail.observed_value)}</strong>
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          isPositive ? "text-semantic-success" : "text-semantic-error"
                        )}
                      >
                        ({isPositive ? "+" : ""}{deltaPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Visual Control Corridor Band */}
                  <div className="relative h-4 w-full rounded bg-subtle overflow-hidden">
                    {/* Baseline Reference Corridor (±3%) */}
                    <div
                      className="absolute top-0 bottom-0 bg-blue-100/70 border-x border-blue-300"
                      style={{
                        left: `${Math.max(0, basePct - 3)}%`,
                        width: "6%",
                      }}
                      title="Baseline 95% Control Corridor"
                    />

                    {/* Baseline Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
                      style={{ left: `${basePct}%` }}
                    />

                    {/* Observed Point Dot */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full border-2 border-white shadow-xs z-20",
                        isPositive ? "bg-emerald-600" : "bg-rose-600"
                      )}
                      style={{ left: `${obsPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-textTertiary">
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
