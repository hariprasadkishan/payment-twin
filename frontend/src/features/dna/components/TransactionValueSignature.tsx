import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { DollarSign, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

interface TransactionValueSignatureProps {
  profile: BehavioralDNAProfile;
}

export const TransactionValueSignature: React.FC<TransactionValueSignatureProps> = ({ profile }) => {
  const summary = profile.amount_distribution.summary;
  const quantiles = profile.amount_distribution.quantiles || {};
  const parametricFit = profile.amount_distribution.parametric_fit;
  const amountPriors = profile.method_priors.amount_conditioned_priors;

  // Sorted quantile entries
  const quantileOrder = ["p10", "p25", "p50", "p75", "p90", "p95", "p99"];
  const quantileValues = quantileOrder
    .filter((k) => quantiles[k] !== undefined)
    .map((k) => ({ key: k.toUpperCase(), value: quantiles[k] }));

  // Maximum value for proportional percentile visual axis
  const maxQuantileVal = quantileValues.length > 0 ? quantileValues[quantileValues.length - 1].value : 5000;

  return (
    <section className="rounded-xl border border-twin-border/90 bg-[#080B12]/95 shadow-xl overflow-hidden space-y-6 p-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-twin-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-twin-cyan" />
            <h3 className="text-base font-display font-bold text-twin-white tracking-tight">
              TRANSACTION VALUE SIGNATURE
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-indigo/15 border border-twin-indigo/30 text-twin-indigo font-semibold uppercase tracking-wider">
              CONTINUOUS AMOUNT DYNAMICS
            </span>
          </div>
          <p className="text-xs text-twin-slate font-light">
            How this merchant's payment behavior changes across ticket size. Parametric and empirical amount metrics.
          </p>
        </div>

        {/* Statistical Validation Badge */}
        {parametricFit && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-twin-border/80 bg-twin-card/50 text-xs font-mono">
            {parametricFit.is_adequate_fit ? (
              <CheckCircle2 className="w-4 h-4 text-twin-success flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-twin-warning flex-shrink-0" />
            )}
            <span className="text-twin-slate text-[11px]">
              Lognormal MLE Fit:{" "}
              <strong className={parametricFit.is_adequate_fit ? "text-twin-success" : "text-twin-warning"}>
                {parametricFit.is_adequate_fit ? "Adequate Fit (p ≥ 0.05)" : "Non-parametric Fallback"}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Summary Statistics Spec Cells */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border/80 space-y-1">
            <span className="text-[10px] text-twin-slate uppercase tracking-wider block">MEAN</span>
            <div className="text-lg font-bold text-twin-white">
              ₹{summary.mean.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-twin-slate/70">Parametric center</span>
          </div>

          <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-cyan/40 bg-twin-cyan/5 space-y-1">
            <span className="text-[10px] text-twin-cyan uppercase tracking-wider font-semibold block">MEDIAN (P50)</span>
            <div className="text-lg font-bold text-twin-cyan">
              ₹{summary.median.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-twin-slate/70">50th percentile</span>
          </div>

          <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border/80 space-y-1">
            <span className="text-[10px] text-twin-slate uppercase tracking-wider block">STD DEV (σ)</span>
            <div className="text-lg font-bold text-twin-white">
              ₹{summary.std_dev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-twin-slate/70">Dispersion spread</span>
          </div>

          <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border/80 space-y-1">
            <span className="text-[10px] text-twin-slate uppercase tracking-wider block">IQR (P75–P25)</span>
            <div className="text-lg font-bold text-twin-white">
              ₹{summary.iqr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-twin-slate/70">Interquartile range</span>
          </div>

          <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border/80 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-twin-slate uppercase tracking-wider block">SKEWNESS</span>
            <div className="text-lg font-bold text-twin-white">
              {summary.skewness.toFixed(2)}
            </div>
            <span className="text-[10px] text-twin-slate/70">
              {summary.skewness > 0 ? "Right-tailed" : "Symmetric"}
            </span>
          </div>
        </div>
      )}

      {/* Percentile Markers & Scale Visual */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] font-bold text-twin-slate uppercase tracking-widest">
            EMPIRICAL PERCENTILE SCALE (TICKET VALUE SPECTRUM)
          </span>
          <span className="text-[10px] text-twin-slate/70">
            N = {profile.amount_distribution.sample_size.toLocaleString()} TICKETS
          </span>
        </div>

        {/* Quantile Spec-Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs font-mono text-center">
          {quantileValues.map(({ key, value }, idx) => {
            const isMedian = key === "P50";
            return (
              <div
                key={key}
                className={`p-3 rounded-lg border transition-all ${
                  isMedian
                    ? "bg-twin-cyan/10 border-twin-cyan/60 shadow-lg shadow-twin-cyan/5"
                    : "bg-twin-card/40 border-twin-border/70 hover:border-twin-slate/60"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase font-semibold pb-1 border-b border-twin-border/40">
                  <span className={isMedian ? "text-twin-cyan font-bold" : ""}>{key}</span>
                  <span className="text-[9px] text-twin-slate/60">idx {idx + 1}</span>
                </div>
                <div className={`text-sm font-bold pt-1.5 ${isMedian ? "text-twin-cyan" : "text-twin-white"}`}>
                  ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Proportional Quantile Progress Gradient Bar */}
        <div className="relative pt-2 pb-1">
          <div className="h-2 w-full rounded-full bg-twin-card/70 border border-twin-border/60 overflow-hidden relative">
            {quantileValues.map(({ key, value }) => {
              const leftPercent = Math.min(99, Math.max(1, (value / (maxQuantileVal || 1)) * 100));
              return (
                <div
                  key={key}
                  className="absolute top-0 bottom-0 w-1 bg-twin-cyan/70"
                  style={{ left: `${leftPercent}%` }}
                  title={`${key}: ₹${value}`}
                />
              );
            })}
            <div
              className="h-full bg-gradient-to-r from-twin-cyan/30 via-twin-indigo/30 to-twin-cyan/60 rounded-full"
              style={{ width: "100%" }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-twin-slate/70 pt-1">
            <span>₹0 (MIN)</span>
            <span className="text-twin-cyan">P50: ₹{summary?.median.toFixed(0)}</span>
            <span>P99: ₹{quantiles.p99?.toFixed(0) ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Amount-Conditioned Rail Selection Priors */}
      {amountPriors && Object.keys(amountPriors).length > 0 && (
        <div className="pt-3 border-t border-twin-border/60 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-twin-slate uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 text-twin-cyan" />
            <span>AMOUNT-CONDITIONED SELECTION PROBABILITIES P(METHOD | TIER)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {Object.entries(amountPriors).map(([tier, priors]) => (
              <div
                key={tier}
                className="p-3.5 rounded-lg bg-twin-card/40 border border-twin-border/70 space-y-2 hover:border-twin-border transition-colors"
              >
                <div className="text-[10px] text-twin-slate uppercase font-bold tracking-wider border-b border-twin-border/40 pb-1">
                  {tier.replace("tier_", "").replace(/_/g, " ")}
                </div>
                <div className="space-y-1">
                  {Object.entries(priors).map(([m, p]) => (
                    <div key={m} className="flex justify-between items-center text-[11px]">
                      <span className="text-twin-slate uppercase">{m}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-twin-card/80 overflow-hidden">
                          <div
                            className="h-full bg-twin-cyan/70 rounded-full"
                            style={{ width: `${p * 100}%` }}
                          />
                        </div>
                        <span className="text-twin-white font-semibold w-9 text-right">
                          {(p * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
