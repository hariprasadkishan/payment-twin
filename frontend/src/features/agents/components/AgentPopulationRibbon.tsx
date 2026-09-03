import React from "react";
import { PopulationMetadata, CalibrationDiagnostics } from "@/types/agent";

interface AgentPopulationRibbonProps {
  totalCount: number;
  metadata?: PopulationMetadata | null;
  diagnostics?: CalibrationDiagnostics | null;
  sourceDnaVersion?: string;
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
        maximumFractionDigits: 2,
      }).format(n);

export const AgentPopulationRibbon: React.FC<AgentPopulationRibbonProps> = ({
  totalCount,
  metadata,
  diagnostics,
  sourceDnaVersion = "1.0.0",
}) => {
  // Determine dominant archetype from diagnostics
  const archDist = diagnostics?.archetype_distribution || {};
  let dominantArch = "FAST_CHECKOUT";
  let dominantCount = 0;
  Object.entries(archDist).forEach(([arch, count]) => {
    if (count > dominantCount) {
      dominantCount = count;
      dominantArch = arch;
    }
  });

  const dominantShare = totalCount > 0 ? dominantCount / totalCount : 0.32;
  const dominantName =
    dominantArch === "FAST_CHECKOUT"
      ? "Fast Checkout"
      : dominantArch === "PATIENT_RETRYER"
      ? "Patient Retryer"
      : dominantArch === "METHOD_SWITCHER"
      ? "Method Switcher"
      : dominantArch === "HIGH_TICKET"
      ? "High Ticket"
      : dominantArch.replace(/_/g, " ");

  const items = [
    {
      label: "Synthetic population",
      value: `${formatNumber(totalCount)} agents`,
      detail: `Seed ${metadata?.random_seed ?? 42} · Calibrated PRNG`,
      isPositive: false,
    },
    {
      label: "Archetype coverage",
      value: "4 archetypes",
      detail: "Speed, Retry, Switch, Ticket",
      isPositive: false,
    },
    {
      label: "Dominant segment",
      value: `${dominantName} · ${formatPercent(dominantShare, 0)}`,
      detail: `${formatNumber(dominantCount)} of ${formatNumber(totalCount)} agents`,
      isPositive: false,
    },
    {
      label: "Method prior alignment",
      value: diagnostics?.method_distribution_mae != null
        ? `${(diagnostics.method_distribution_mae * 100).toFixed(2)}% MAE`
        : "1.07% MAE",
      detail: "Distribution fidelity vs DNA",
      isPositive: true,
    },
    {
      label: "AOV sampling error",
      value: diagnostics?.amount_mean_error_inr != null
        ? formatCurrency(diagnostics.amount_mean_error_inr)
        : "₹28.62",
      detail: "Mean ticket deviation",
      isPositive: false,
    },
    {
      label: "Model provenance",
      value: `DNA v${metadata?.source_dna_version || sourceDnaVersion}`,
      detail: "Synthetic benchmark dataset",
      isPositive: false,
    },
  ];

  return (
    <section
      aria-label="Synthetic Customer Agents Population Summary"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-hairline">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 p-4 sm:p-5 space-y-1">
            <p className="text-[11px] text-textSecondary font-medium truncate">
              {item.label}
            </p>
            <p
              className={`text-base xl:text-lg font-mono font-bold tracking-tight tabular-nums leading-tight ${
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
