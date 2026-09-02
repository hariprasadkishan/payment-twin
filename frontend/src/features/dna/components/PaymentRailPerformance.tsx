import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { Layers, Landmark } from "lucide-react";

interface PaymentRailPerformanceProps {
  profile: BehavioralDNAProfile;
}

export const PaymentRailPerformance: React.FC<PaymentRailPerformanceProps> = ({ profile }) => {
  const methodColors: Record<string, string> = {
    upi: "#06B6D4",
    card: "#6366F1",
    netbanking: "#F59E0B",
    wallet: "#10B981",
    emi: "#EC4899",
  };

  const methods = Object.entries(profile.method_priors.probabilities || {}).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <section className="rounded-xl border border-twin-border/90 bg-[#080B12]/95 shadow-xl overflow-hidden space-y-6 p-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-twin-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-twin-cyan" />
            <h3 className="text-base font-display font-bold text-twin-white tracking-tight">
              PAYMENT RAIL PERFORMANCE
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-cyan/15 border border-twin-cyan/30 text-twin-cyan font-semibold uppercase tracking-wider">
              EMPIRICAL BASELINE
            </span>
          </div>
          <p className="text-xs text-twin-slate font-light">
            Marginal payment instrument selection priors paired with empirical capture rates and Wilson analytical 95% confidence bounds.
          </p>
        </div>

        <div className="text-right font-mono text-[11px] text-twin-slate">
          <span>PRIOR SUM: </span>
          <span className="font-bold text-twin-white">
            {(methods.reduce((sum, [, p]) => sum + p, 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Dominant Instrument Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-twin-border text-[10px] text-twin-slate uppercase tracking-widest bg-twin-card/30">
              <th className="py-3 px-4">METHOD</th>
              <th className="py-3 px-4 w-44 sm:w-64">EMPIRICAL PRIOR SHARE</th>
              <th className="py-3 px-4 text-right">PRIOR %</th>
              <th className="py-3 px-4 text-right">ATTEMPTS</th>
              <th className="py-3 px-4 text-right">CAPTURE RATE</th>
              <th className="py-3 px-4 text-right">95% CONFIDENCE INTERVAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-twin-border/50">
            {methods.map(([method, priorProb]) => {
              const methodKey = method.toLowerCase();
              const color = methodColors[methodKey] || "#94A3B8";
              const priorPercent = priorProb * 100;
              const dynamic = profile.success_dynamics.by_method?.[methodKey];
              const sampleSize = dynamic?.sample_size ?? 0;
              const captureRate = dynamic ? (dynamic.rate * 100).toFixed(1) : "—";
              const ci = dynamic?.ci_95;

              return (
                <tr key={method} className="hover:bg-twin-card/40 transition-colors">
                  {/* Method */}
                  <td className="py-3.5 px-4 font-bold text-twin-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="uppercase tracking-wider">{method}</span>
                  </td>

                  {/* Prior Share Visual Proportional Bar */}
                  <td className="py-3.5 px-4">
                    <div className="w-full h-2.5 rounded bg-twin-card/60 overflow-hidden flex items-center p-0.5 border border-twin-border/50">
                      <div
                        className="h-full rounded-sm transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(2, priorPercent))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </td>

                  {/* Prior % */}
                  <td className="py-3.5 px-4 text-right font-bold text-twin-white">
                    {priorPercent.toFixed(1)}%
                  </td>

                  {/* Attempts */}
                  <td className="py-3.5 px-4 text-right text-twin-slate">
                    {sampleSize.toLocaleString()}
                  </td>

                  {/* Capture Rate */}
                  <td className="py-3.5 px-4 text-right font-bold text-twin-cyan">
                    {captureRate}%
                  </td>

                  {/* Wilson 95% Confidence Interval */}
                  <td className="py-3.5 px-4 text-right text-twin-slate font-medium">
                    {ci ? (
                      <span className="px-2 py-0.5 rounded bg-[#0A101D] border border-twin-border/80 text-[11px] text-twin-slate">
                        [{(ci[0] * 100).toFixed(1)}% – {(ci[1] * 100).toFixed(1)}%]
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Secondary Instrument: Issuing Bank Performance Grid */}
      {profile.success_dynamics.by_bank && Object.keys(profile.success_dynamics.by_bank).length > 0 && (
        <div className="pt-3 border-t border-twin-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-twin-slate uppercase tracking-widest flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-twin-indigo" />
              ISSUING BANK PERFORMANCE (SECONDARY TELEMETRY)
            </span>
            <span className="text-[10px] font-mono text-twin-slate/70">
              {Object.keys(profile.success_dynamics.by_bank).length} INSTITUTIONS PROFILED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
            {Object.entries(profile.success_dynamics.by_bank).map(([bank, metric]) => (
              <div
                key={bank}
                className="p-2.5 rounded-lg bg-twin-card/40 border border-twin-border/70 space-y-1 hover:border-twin-indigo/40 transition-colors"
              >
                <div className="text-[10px] text-twin-slate uppercase font-semibold truncate">
                  {bank}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-twin-white">
                    {(metric.rate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-twin-slate">
                    n={metric.sample_size}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
