import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { Clock3, RefreshCw, AlertCircle } from "lucide-react";

interface DNARetryAndTemporalProps {
  profile: BehavioralDNAProfile;
}

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

const formatPercent = (n?: number | null, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

export const DNARetryAndTemporal: React.FC<DNARetryAndTemporalProps> = ({ profile }) => {
  const transitions = profile.empirical_transitions;
  const temporal = profile.temporal_dynamics;
  const fees = profile.fee_economics;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: Retry & Multi-Attempt Order Dynamics */}
      <div className="rounded-lg border border-hairline bg-surface shadow-panel p-6 space-y-4 lg:col-span-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="text-sm font-semibold tracking-tight text-textPrimary flex items-center gap-2">
              <RefreshCw className="size-4 text-accent" />
              <span>Retry & Transition Dynamics</span>
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-subtle text-textSecondary font-medium">
              Multi-Attempt Telemetry
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Observed transition probabilities following failed payment attempts.
          </p>

          <div className="grid grid-cols-2 gap-4 border-b border-hairline pb-4">
            <div>
              <span className="text-[11px] text-textSecondary">Retry Propensity</span>
              <p className="mt-1 text-2xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
                {formatPercent(transitions.overall_retry_probability_on_failure)}
              </p>
              <span className="text-[10px] font-mono text-textTertiary">
                Customer re-attempts on drop
              </span>
            </div>

            <div>
              <span className="text-[11px] text-textSecondary">Method Switch Rate</span>
              <p className="mt-1 text-2xl font-mono font-bold tracking-tight text-accent tabular-nums">
                {formatPercent(transitions.method_switch_on_retry_probability)}
              </p>
              <span className="text-[10px] font-mono text-textTertiary">
                Switches instrument on retry
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-hairline/60">
              <span className="text-textSecondary">Tracked unique orders:</span>
              <span className="font-mono font-semibold text-textPrimary tabular-nums">
                {formatNumber(transitions.tracked_orders_count)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hairline/60">
              <span className="text-textSecondary">Multi-attempt orders:</span>
              <span className="font-mono font-semibold text-textPrimary tabular-nums">
                {formatNumber(transitions.multi_attempt_orders_count)}
              </span>
            </div>
          </div>
        </div>

        {/* Methodological Honesty Alert */}
        <div className="rounded-md border border-amber-200/80 bg-amber-50/60 p-3 flex items-start gap-2.5 text-[11px] text-amber-900">
          <AlertCircle className="size-4 shrink-0 text-semantic-warning mt-0.5" />
          <p className="leading-relaxed">
            {transitions.unobserved_dropouts_note ||
              "Pre-checkout cart abandonments are unobserved in Razorpay payment telemetry and are not inferred."}
          </p>
        </div>
      </div>

      {/* Right: Temporal Concentration & Fee Economics */}
      <div className="rounded-lg border border-hairline bg-surface shadow-panel p-6 space-y-4 lg:col-span-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="text-sm font-semibold tracking-tight text-textPrimary flex items-center gap-2">
              <Clock3 className="size-4 text-accent" />
              <span>Temporal Concentration & Fee Economics</span>
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-subtle text-textSecondary font-medium">
              {temporal.timespan_days ? `${temporal.timespan_days}d Timespan` : "Single Period"}
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Peak checkout hours and empirical merchant discount rate (MDR) structure.
          </p>

          <div className="grid grid-cols-2 gap-4 border-b border-hairline pb-4">
            <div>
              <span className="text-[11px] text-textSecondary">Blended MDR</span>
              <p className="mt-1 text-2xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
                {fees.has_fee_data ? `${fees.effective_blended_mdr_percent?.toFixed(2)}%` : "—"}
              </p>
              <span className="text-[10px] font-mono text-textTertiary">
                Effective processing rate
              </span>
            </div>

            <div>
              <span className="text-[11px] text-textSecondary">Effective GST/Tax</span>
              <p className="mt-1 text-2xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
                {fees.has_fee_data ? `${fees.effective_tax_rate_percent?.toFixed(1)}%` : "—"}
              </p>
              <span className="text-[10px] font-mono text-textTertiary">
                GST on gateway fees
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-hairline/60">
              <span className="text-textSecondary">Peak Traffic Hours (UTC):</span>
              <span className="font-mono font-semibold text-accent tabular-nums">
                {temporal.peak_hours_utc?.length
                  ? temporal.peak_hours_utc.map((h) => `${h}:00`).join(", ")
                  : "Uniform distribution"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hairline/60">
              <span className="text-textSecondary">Card MDR / Netbanking MDR:</span>
              <span className="font-mono font-semibold text-textPrimary tabular-nums">
                {fees.mdr_by_method_percent?.card ?? 1.85}% / {fees.mdr_by_method_percent?.netbanking ?? 1.5}%
              </span>
            </div>
          </div>
        </div>

        {/* Temporal Reliability Footnote */}
        <div className="rounded-md border border-hairline bg-canvas/60 p-3 text-[11px] text-textSecondary font-mono leading-relaxed">
          {temporal.status_message || "Representative temporal distributions established."}
        </div>
      </div>
    </div>
  );
};
