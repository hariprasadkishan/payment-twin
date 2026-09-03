import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { BarChart3, CheckCircle2 } from "lucide-react";

interface DNAAmountDistributionProps {
  profile: BehavioralDNAProfile;
}

const formatCurrency = (n?: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

export const DNAAmountDistribution: React.FC<DNAAmountDistributionProps> = ({ profile }) => {
  const amount = profile.amount_distribution;
  const summary = amount.summary;
  const quantiles = amount.quantiles;
  const fit = amount.parametric_fit;

  const quantileList = [
    { label: "P10", value: quantiles?.p10 },
    { label: "P25", value: quantiles?.p25 },
    { label: "P50 (Median)", value: quantiles?.p50, isHighlight: true },
    { label: "P75", value: quantiles?.p75 },
    { label: "P90", value: quantiles?.p90 },
    { label: "P95", value: quantiles?.p95 },
    { label: "P99", value: quantiles?.p99 },
  ];

  const maxVal = quantiles?.p99 || 8000;

  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-panel space-y-6 p-6">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-textPrimary flex items-center gap-2">
              <BarChart3 className="size-4 text-accent" />
              <span>Transaction Value & Ticket Size Distribution</span>
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-subtle text-textSecondary font-medium">
              n={formatNumber(amount.sample_size)} orders
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Empirical quantiles, parametric statistical fit, and order value spectrum.
          </p>
        </div>

        {fit?.is_adequate_fit && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <CheckCircle2 className="size-3.5 text-semantic-success" />
            <span className="font-medium capitalize">{fit.distribution_family} Fit Validated</span>
          </div>
        )}
      </div>

      {/* Unboxed Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-hairline pb-5">
        <div>
          <span className="text-[11px] font-medium text-textSecondary">Mean Ticket</span>
          <p className="mt-1 text-xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
            {formatCurrency(summary?.mean)}
          </p>
          <span className="text-[10px] font-mono text-textTertiary">
            Std Dev: {formatCurrency(summary?.std_dev)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-textSecondary">Median Ticket (P50)</span>
          <p className="mt-1 text-xl font-mono font-bold tracking-tight text-accent tabular-nums">
            {formatCurrency(summary?.median)}
          </p>
          <span className="text-[10px] font-mono text-textTertiary">50th percentile order</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-textSecondary">Interquartile Range</span>
          <p className="mt-1 text-xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
            {formatCurrency(summary?.iqr)}
          </p>
          <span className="text-[10px] font-mono text-textTertiary">P25 to P75 dispersion</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-textSecondary">Distribution Skew</span>
          <p className="mt-1 text-xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
            {summary?.skewness?.toFixed(2) ?? "—"}
          </p>
          <span className="text-[10px] font-mono text-textTertiary">Right-tailed log-normal</span>
        </div>
      </div>

      {/* Quantile Spectrum Timeline */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-textSecondary">
          <span>Ticket Value Quantile Scale</span>
          <span className="font-mono text-[11px]">Range: {formatCurrency(quantiles?.p10)} – {formatCurrency(quantiles?.p99)}</span>
        </div>

        {/* Visual Quantile Ruler */}
        <div className="relative h-2 w-full rounded-full bg-blue-50/80 border border-blue-100">
          {quantileList.map(({ label, value, isHighlight }) => {
            if (value == null) return null;
            const pct = Math.min(98, Math.max(2, (value / maxVal) * 100));

            return (
              <div
                key={label}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer"
                style={{ left: `${pct}%` }}
                title={`${label}: ${formatCurrency(value)}`}
              >
                <div
                  className={`size-3 rounded-full border-2 border-surface transition-transform group-hover:scale-125 ${
                    isHighlight ? "bg-accent size-3.5 ring-2 ring-blue-200" : "bg-blue-600"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Quantile Cards Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {quantileList.map(({ label, value, isHighlight }) => (
            <div
              key={label}
              className={`rounded-md p-2.5 text-center border transition-colors ${
                isHighlight
                  ? "bg-blue-50/70 border-blue-200 text-accent"
                  : "bg-canvas/50 border-hairline text-textPrimary"
              }`}
            >
              <span className="block text-[10px] font-mono uppercase text-textTertiary">
                {label}
              </span>
              <span className="block font-mono font-bold text-xs mt-0.5 tabular-nums">
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Statistical Note */}
      {fit?.note && (
        <p className="text-[11px] text-textSecondary border-t border-hairline pt-3 font-mono leading-relaxed">
          Statistical inference note: {fit.note}
        </p>
      )}
    </div>
  );
};
