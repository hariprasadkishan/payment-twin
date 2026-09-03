import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";

interface DNASummaryRibbonProps {
  profile: BehavioralDNAProfile;
}

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

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

export const DNASummaryRibbon: React.FC<DNASummaryRibbonProps> = ({ profile }) => {
  const provenance = profile.provenance;
  const reliability = profile.reliability;
  const success = profile.success_dynamics;
  const methods = Object.entries(profile.method_priors.probabilities || {}).sort(
    ([, a], [, b]) => b - a
  );
  const topMethod = methods[0] || ["upi", 0];
  const transitions = profile.empirical_transitions;
  const amount = profile.amount_distribution;
  const temporal = profile.temporal_dynamics;

  const items = [
    {
      label: "Empirical sample",
      value: `${formatNumber(provenance.total_sample_size)} records`,
      detail:
        provenance.data_source_type === "SYNTHETIC_BENCHMARK_DATA"
          ? "Synthetic benchmark"
          : "Observed Razorpay",
    },
    {
      label: "Overall capture rate",
      value: formatPercent(success.overall_success_rate),
      detail: success.overall_confidence_interval_95
        ? `95% CI: ${formatPercent(success.overall_confidence_interval_95[0])} – ${formatPercent(
            success.overall_confidence_interval_95[1]
          )}`
        : "Wilson analytical interval",
      isPositive: true,
    },
    {
      label: "Dominant rail",
      value: `${topMethod[0].toUpperCase()} (${formatPercent(topMethod[1])})`,
      detail: `${formatNumber(
        success.by_method?.[topMethod[0]]?.sample_size
      )} attempts · ${formatPercent(success.by_method?.[topMethod[0]]?.rate)} capture`,
    },
    {
      label: "Retry on failure",
      value: formatPercent(transitions.overall_retry_probability_on_failure),
      detail: `${formatPercent(transitions.method_switch_on_retry_probability)} switch method on retry`,
    },
    {
      label: "Typical ticket",
      value: formatCurrency(amount.summary?.median),
      detail: `Mean ${formatCurrency(amount.summary?.mean)} · P95 ${formatCurrency(
        amount.quantiles?.p95
      )}`,
    },
    {
      label: "Profile reliability",
      value: reliability.confidence_grade.replace(/_/g, " "),
      detail: `${(reliability.confidence_score * 100).toFixed(0)}% score · ${
        temporal.timespan_days ? `${temporal.timespan_days}d timespan` : "Single period"
      }`,
    },
  ];

  return (
    <section
      aria-label="Behavioral DNA Summary Ribbon"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-hairline">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 p-4 sm:p-5 space-y-1">
            <p className="text-[11px] text-textSecondary font-medium truncate">
              {item.label}
            </p>
            <p
              className={`text-lg font-mono font-bold tracking-tight tabular-nums truncate ${
                item.isPositive ? "text-semantic-success" : "text-textPrimary"
              }`}
            >
              {item.value}
            </p>
            <p className="text-[10px] text-textTertiary truncate">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
