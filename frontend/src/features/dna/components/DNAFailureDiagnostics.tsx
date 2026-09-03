import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { ShieldAlert } from "lucide-react";

interface DNAFailureDiagnosticsProps {
  profile: BehavioralDNAProfile;
}

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

const formatPercent = (n?: number | null, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

export const DNAFailureDiagnostics: React.FC<DNAFailureDiagnosticsProps> = ({ profile }) => {
  const failures = profile.failure_diagnostics;
  const errorSources = Object.entries(failures.error_source_distribution || {}).sort(
    ([, a], [, b]) => b - a
  );
  const errorSteps = Object.entries(failures.error_step_distribution || {}).sort(
    ([, a], [, b]) => b - a
  );
  const topReasons = Object.entries(failures.top_error_reasons || {}).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-textPrimary flex items-center gap-2">
              <ShieldAlert className="size-4 text-semantic-danger" />
              <span>Observed Friction & Failure Diagnostics</span>
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-red-200 bg-red-50 text-semantic-danger font-medium">
              n={formatNumber(failures.failed_sample_size)} failed attempts
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Decomposition of unsuccessful transactions by origin, funnel step, and root error code.
          </p>
        </div>
      </div>

      {/* 2-Column Error Origin & Funnel Step Bars */}
      <div className="grid gap-6 md:grid-cols-2 border-b border-hairline pb-6">
        {/* Error Origin Sources */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-textPrimary block">
            Error Origin Attribution
          </span>
          <div className="space-y-2.5">
            {errorSources.map(([source, share]) => (
              <div key={source} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-textPrimary font-medium">{source} Fault</span>
                  <span className="font-mono font-semibold text-textPrimary tabular-nums">
                    {formatPercent(share)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      source === "customer"
                        ? "bg-amber-500"
                        : source === "bank"
                        ? "bg-red-500"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel Step Dropoff */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-textPrimary block">
            Funnel Stage of Failure
          </span>
          <div className="space-y-2.5">
            {errorSteps.map(([step, share]) => (
              <div key={step} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-textPrimary font-medium">
                    {step.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono font-semibold text-textPrimary tabular-nums">
                    {formatPercent(share)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      step.includes("authentication") ? "bg-amber-500" : "bg-red-600"
                    }`}
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Failure Reasons Table */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-textPrimary block">
          Primary Error Mechanisms
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline text-[10px] font-mono uppercase tracking-wider text-textTertiary">
                <th className="pb-2 font-medium">Failure Reason</th>
                <th className="pb-2 text-right font-medium">Incidence Share</th>
                <th className="pb-2 text-right font-medium">Estimated Drops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/60">
              {topReasons.map(([reason, share]) => {
                const estCount = Math.round(failures.failed_sample_size * share);

                return (
                  <tr key={reason} className="hover:bg-subtle/30 transition-colors">
                    <td className="py-2.5 font-medium text-textPrimary capitalize flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-semantic-danger inline-block" />
                      <span>{reason.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-textPrimary tabular-nums">
                      {formatPercent(share)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-textSecondary tabular-nums">
                      ~{estCount} attempts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
