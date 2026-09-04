import React from "react";
import { SimulationKPIs } from "@/types/simulation";

interface SimulationExecutiveSummaryProps {
  kpis: SimulationKPIs;
}

const formatCurrency = (n?: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);

export const SimulationExecutiveSummary: React.FC<SimulationExecutiveSummaryProps> = ({
  kpis,
}) => {
  const supportingMetrics = [
    {
      label: "Net Settled Revenue",
      value: formatCurrency(kpis.net_merchant_revenue_inr),
      detail: `Gross: ${formatCurrency(kpis.captured_volume_inr)}`,
      highlight: true,
    },
    {
      label: "Terminal Declines",
      value: `${kpis.failed_transactions.toLocaleString()} orders`,
      detail: `${kpis.failure_rate_percent.toFixed(1)}% · ${formatCurrency(kpis.lost_volume_inr)} lost`,
      isError: true,
    },
    {
      label: "Cart Abandonment",
      value: `${kpis.abandoned_transactions.toLocaleString()} drops`,
      detail: `${kpis.abandonment_rate_percent.toFixed(1)}% pre-auth / timeout`,
    },
    {
      label: "Payment Attempts",
      value: `${kpis.total_payment_attempts.toLocaleString()} total`,
      detail: `${(kpis.total_payment_attempts / (kpis.total_agents || 1)).toFixed(2)}x / agent · +${kpis.retry_attempts_count} retries`,
    },
    {
      label: "Acquirer Fees & Taxes",
      value: formatCurrency(kpis.total_processing_fees_inr),
      detail: `GST: ${formatCurrency(kpis.total_taxes_inr)} · ${( (kpis.total_processing_fees_inr / (kpis.captured_volume_inr || 1)) * 100 ).toFixed(2)}% take rate`,
    },
  ];

  return (
    <section
      aria-label="Simulated Financial Outcome Summary"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-hairline">
        {/* Dominant Primary Anchor: Simulated Conversion (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-canvas/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
              SIMULATED OUTCOME
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
              Deterministic Conversion
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-textPrimary font-mono tabular-nums tracking-tight">
              {kpis.conversion_rate_percent.toFixed(1)}%
            </span>
            <span className="text-xs text-textSecondary font-mono">
              capture rate
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            {kpis.successful_transactions.toLocaleString()} of {kpis.total_agents.toLocaleString()} unique synthetic agents completed the simulated checkout funnel.
          </p>
        </div>

        {/* 5 Continuous Supporting Metrics (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-hairline">
          {supportingMetrics.map((item) => (
            <div key={item.label} className="p-4 space-y-1 min-w-0">
              <span className="text-[10px] font-medium text-textTertiary truncate block uppercase tracking-wider">
                {item.label}
              </span>
              <p
                className={`text-sm xl:text-base font-mono font-bold tabular-nums truncate ${
                  item.isError
                    ? "text-semantic-error"
                    : item.highlight
                    ? "text-accent"
                    : "text-textPrimary"
                }`}
              >
                {item.value}
              </p>
              <span className="text-[10px] text-textTertiary truncate block font-mono">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
