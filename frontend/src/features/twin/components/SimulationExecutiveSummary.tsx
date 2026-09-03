import React from "react";
import { SimulationKPIs } from "@/types/simulation";

interface SimulationExecutiveSummaryProps {
  kpis: SimulationKPIs;
}

export const SimulationExecutiveSummary: React.FC<SimulationExecutiveSummaryProps> = ({
  kpis,
}) => {
  return (
    <section className="space-y-3">
      {/* 1. Two Dominant Primary Outcome Anchors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Dominant 1: Capture Conversion Rate */}
        <div className="p-4 rounded-lg border border-hairline bg-surface shadow-panel space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
              Primary Simulation Outcome
            </span>
            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              Capture Conversion
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-textPrimary font-mono tabular-nums tracking-tight">
              {kpis.conversion_rate_percent.toFixed(1)}%
            </span>
            <span className="text-xs text-textSecondary font-mono">
              ({kpis.successful_transactions.toLocaleString()} of {kpis.total_agents.toLocaleString()} unique agents converted)
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-normal">
            Stochastically modelled end-to-end checkout funnel completion across all payment rails and retry attempts.
          </p>
        </div>

        {/* Dominant 2: Net Merchant Revenue */}
        <div className="p-4 rounded-lg border border-hairline bg-surface shadow-panel space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
              Settled Financial Economics
            </span>
            <span className="text-[10px] font-medium text-accent bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
              Net Revenue
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-textPrimary font-mono tabular-nums tracking-tight">
              ₹{kpis.net_merchant_revenue_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-textSecondary font-mono">
              (Gross: ₹{kpis.captured_volume_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })})
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-normal">
            Net settled merchant proceeds after deducting simulated acquirer MDR gateway processing fees and GST taxes.
          </p>
        </div>
      </div>

      {/* 2. Compact Supporting Operational Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-surface rounded-lg border border-hairline shadow-panel overflow-hidden">
        {/* Metric 1: Terminal Declines */}
        <div className="p-3 space-y-0.5">
          <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">
            Terminal Declines
          </span>
          <div className="text-sm font-bold font-mono text-red-700 tabular-nums">
            {kpis.failed_transactions.toLocaleString()} ({kpis.failure_rate_percent.toFixed(1)}%)
          </div>
          <span className="text-[10px] text-textTertiary block">Hard acquirer declines</span>
        </div>

        {/* Metric 2: Friction Abandonments */}
        <div className="p-3 space-y-0.5">
          <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">
            Friction Drops
          </span>
          <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            {kpis.abandoned_transactions.toLocaleString()} ({kpis.abandonment_rate_percent.toFixed(1)}%)
          </div>
          <span className="text-[10px] text-textTertiary block">Pre-auth or timeout</span>
        </div>

        {/* Metric 3: Total Attempts & Retries */}
        <div className="p-3 space-y-0.5">
          <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">
            Payment Attempts
          </span>
          <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            {kpis.total_payment_attempts.toLocaleString()}
          </div>
          <span className="text-[10px] text-textSecondary block tabular-nums">
            +{kpis.retry_attempts_count} retries
          </span>
        </div>

        {/* Metric 4: Method Switches */}
        <div className="p-3 space-y-0.5">
          <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">
            Method Switches
          </span>
          <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            {kpis.method_switches_count.toLocaleString()}
          </div>
          <span className="text-[10px] text-textTertiary block">Flipped rail on decline</span>
        </div>

        {/* Metric 5: Gateway MDR & Fees */}
        <div className="p-3 space-y-0.5">
          <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">
            MDR Fees & Tax
          </span>
          <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            ₹{(kpis.total_processing_fees_inr + kpis.total_taxes_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-textTertiary block">Interchange costs</span>
        </div>

        {/* Metric 6: Avg Attempts / Success */}
        <div className="p-3 space-y-0.5">
          <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">
            Attempts / Success
          </span>
          <div className="text-sm font-bold font-mono text-accent tabular-nums">
            {kpis.average_attempts_per_success.toFixed(2)}x
          </div>
          <span className="text-[10px] text-textTertiary block tabular-nums">
            {kpis.execution_duration_ms.toFixed(1)}ms duration
          </span>
        </div>
      </div>
    </section>
  );
};
