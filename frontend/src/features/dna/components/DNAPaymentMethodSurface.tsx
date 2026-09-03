import React, { useState } from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface DNAPaymentMethodSurfaceProps {
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

export const DNAPaymentMethodSurface: React.FC<DNAPaymentMethodSurfaceProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<"rails" | "subinstruments">("rails");

  const methods = Object.entries(profile.method_priors.probabilities || {}).sort(
    ([, a], [, b]) => b - a
  );
  const success = profile.success_dynamics;
  const reliability = profile.reliability;
  const subInstruments = profile.method_priors.sub_instrument_priors;
  const aov = profile.amount_distribution.aov_by_method;

  const methodIcons: Record<string, React.ElementType> = {
    upi: Smartphone,
    card: CreditCard,
    netbanking: Building2,
    wallet: Wallet,
  };

  const methodColors: Record<string, string> = {
    upi: "#1e3a8a", // Deep navy
    card: "#2563eb", // Electric blue
    netbanking: "#475569", // Slate
    wallet: "#94a3b8", // Light slate
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-panel space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline px-6 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-textPrimary">
              Payment Rail Mix & Capture Dynamics
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-subtle text-textSecondary font-medium">
              Empirical Prior Matrix
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Empirical instrument selection priors paired with Wilson 95% analytical confidence intervals.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-md border border-hairline bg-canvas p-0.5 text-[11px] font-medium text-textSecondary">
          <button
            onClick={() => setActiveTab("rails")}
            className={cn(
              "px-3 py-1 rounded transition-colors",
              activeTab === "rails"
                ? "bg-surface text-textPrimary shadow-xs font-semibold"
                : "hover:text-textPrimary"
            )}
          >
            Payment Rails
          </button>
          <button
            onClick={() => setActiveTab("subinstruments")}
            className={cn(
              "px-3 py-1 rounded transition-colors",
              activeTab === "subinstruments"
                ? "bg-surface text-textPrimary shadow-xs font-semibold"
                : "hover:text-textPrimary"
            )}
          >
            Sub-Instruments (VPA & Banks)
          </button>
        </div>
      </div>

      {activeTab === "rails" ? (
        <div className="px-6 pb-6 space-y-6">
          {/* Aggregate Distribution Bar */}
          <div className="space-y-2">
            <div className="flex h-3 w-full overflow-hidden rounded-md bg-subtle">
              {methods.map(([method, prob]) => (
                <div
                  key={method}
                  style={{
                    width: `${prob * 100}%`,
                    backgroundColor: methodColors[method] || "#475569",
                  }}
                  title={`${method.toUpperCase()}: ${formatPercent(prob)}`}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              {methods.map(([method, prob]) => {
                const Icon = methodIcons[method] || CreditCard;
                return (
                  <div key={method} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full inline-block"
                      style={{ backgroundColor: methodColors[method] || "#475569" }}
                    />
                    <Icon className="size-3.5 text-textSecondary" />
                    <span className="font-medium text-textPrimary capitalize">{method}</span>
                    <span className="font-mono text-textSecondary tabular-nums">
                      {formatPercent(prob)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Method Analytical Rows */}
          <div className="divide-y divide-hairline border-t border-hairline pt-2">
            {methods.map(([method, prob]) => {
              const metric = success.by_method?.[method];
              const Icon = methodIcons[method] || CreditCard;
              const methodAov = aov?.[method];
              const subReliability = reliability.subsegment_reliability?.[method] || "MODERATE";
              const ci = metric?.ci_95;

              return (
                <div
                  key={method}
                  className="py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-center hover:bg-subtle/30 px-3 rounded-md transition-colors"
                >
                  {/* Method ID & Reliability */}
                  <div className="xl:col-span-3 flex items-center gap-3">
                    <div
                      className="grid size-8 shrink-0 place-items-center rounded-md text-white font-semibold text-xs"
                      style={{ backgroundColor: methodColors[method] || "#475569" }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-textPrimary capitalize">
                          {method}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border",
                            subReliability === "HIGH"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-accent border-blue-200"
                          )}
                        >
                          {subReliability}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-textTertiary tabular-nums">
                        n={formatNumber(metric?.sample_size)} attempts
                      </span>
                    </div>
                  </div>

                  {/* Prior Share Progress Bar */}
                  <div className="xl:col-span-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-textSecondary">Empirical Prior:</span>
                      <span className="font-mono font-semibold text-textPrimary tabular-nums">
                        {formatPercent(prob)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${prob * 100}%`,
                          backgroundColor: methodColors[method] || "#475569",
                        }}
                      />
                    </div>
                  </div>

                  {/* Capture Rate & 95% Wilson Confidence Interval */}
                  <div className="xl:col-span-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-textSecondary">Capture Rate:</span>
                      <span className="font-mono font-bold text-semantic-success tabular-nums">
                        {formatPercent(metric?.rate)}
                      </span>
                    </div>
                    {ci ? (
                      <div className="space-y-0.5">
                        <div className="relative h-1.5 w-full rounded-full bg-emerald-50 overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 bg-semantic-success rounded-full"
                            style={{
                              left: `${ci[0] * 100}%`,
                              width: `${(ci[1] - ci[0]) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-textTertiary text-right tabular-nums">
                          95% CI: [{formatPercent(ci[0])} – {formatPercent(ci[1])}]
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-textTertiary">—</span>
                    )}
                  </div>

                  {/* Average Ticket / AOV */}
                  <div className="xl:col-span-2 md:text-right">
                    <span className="text-[10px] font-mono uppercase text-textTertiary block">
                      Method AOV
                    </span>
                    <span className="font-mono font-bold text-xs text-textPrimary tabular-nums">
                      {formatCurrency(methodAov)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Sub-Instruments Breakdown (UPI VPAs & Issuing Banks) */
        <div className="px-6 pb-6 grid gap-6 md:grid-cols-2">
          {/* UPI VPA Providers */}
          <div className="rounded-md border border-hairline bg-canvas/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-xs font-semibold text-textPrimary flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-accent" />
                  <span>UPI VPA Handle Distribution</span>
                </h3>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Observed PSP handle share across UPI payments.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(subInstruments?.upi_providers || {})
                .sort(([, a], [, b]) => b - a)
                .map(([vpa, share]) => (
                  <div key={vpa} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-textPrimary">@{vpa}</span>
                      <span className="font-mono font-semibold text-textPrimary tabular-nums">
                        {formatPercent(share)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Issuing Bank Performance */}
          <div className="rounded-md border border-hairline bg-canvas/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-xs font-semibold text-textPrimary flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-accent" />
                  <span>Issuing Bank Distribution & Capture</span>
                </h3>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Top issuing banks and their empirical capture rates.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(subInstruments?.banks || {})
                .sort(([, a], [, b]) => b - a)
                .map(([bank, share]) => {
                  const bankMetric = success.by_bank?.[bank];

                  return (
                    <div key={bank} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-textPrimary">{bank}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-textSecondary tabular-nums">
                            {formatPercent(share)} share
                          </span>
                          <span className="text-textTertiary">·</span>
                          <span className="font-mono font-semibold text-semantic-success tabular-nums">
                            {formatPercent(bankMetric?.rate)} capture
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${share * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
