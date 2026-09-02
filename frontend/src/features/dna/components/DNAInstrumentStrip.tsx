import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Compass, TrendingUp, DollarSign, RotateCcw } from "lucide-react";

interface DNAInstrumentStripProps {
  profile: BehavioralDNAProfile;
}

export const DNAInstrumentStrip: React.FC<DNAInstrumentStripProps> = ({ profile }) => {
  // 01 / METHOD PREFERENCE: Top method and probability
  const sortedMethods = Object.entries(profile.method_priors.probabilities || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const topMethod = sortedMethods[0] || ["upi", 0];
  const topMethodName = topMethod[0].toUpperCase();
  const topMethodPercent = topMethod[1] * 100;

  // 02 / SUCCESS DYNAMICS: Top method capture rate & Wilson bounds
  const topMethodDynamic = profile.success_dynamics.by_method?.[topMethod[0].toLowerCase()];
  const topCaptureRate = topMethodDynamic ? topMethodDynamic.rate * 100 : 0;
  const topCi = topMethodDynamic?.ci_95;

  // 03 / TICKET SIZE: Median amount
  const medianAmount = profile.amount_distribution.summary?.median ?? 0;
  const meanAmount = profile.amount_distribution.summary?.mean ?? 0;

  // 04 / FAILURE + RETRY: Retry propensity on failure
  const retryPropensity = profile.empirical_transitions.overall_retry_probability_on_failure !== null &&
    profile.empirical_transitions.overall_retry_probability_on_failure !== undefined
      ? profile.empirical_transitions.overall_retry_probability_on_failure * 100
      : null;
  const switchPropensity = profile.empirical_transitions.method_switch_on_retry_probability !== null &&
    profile.empirical_transitions.method_switch_on_retry_probability !== undefined
      ? profile.empirical_transitions.method_switch_on_retry_probability * 100
      : null;

  return (
    <div className="rounded-xl border border-twin-border/90 bg-[#080B12]/95 shadow-xl overflow-hidden">
      {/* Instrumentation Spec-Cells Header Banner */}
      <div className="px-5 py-2.5 bg-[#0C1220]/80 border-b border-twin-border/60 flex items-center justify-between text-[10px] font-mono text-twin-slate uppercase tracking-widest">
        <span className="flex items-center gap-1.5 font-bold text-twin-cyan">
          <Compass className="w-3.5 h-3.5" />
          WHAT THE DNA KNOWS — 4-DIMENSION BEHAVIORAL INSTRUMENTATION
        </span>
        <span className="text-twin-slate/70">EMPIRICAL SAMPLING N={profile.provenance.total_sample_size.toLocaleString()}</span>
      </div>

      {/* 4-Spec Cell Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-twin-border/70 font-mono">
        {/* Cell 01: Method Preference */}
        <div className="p-5 space-y-2 hover:bg-[#0B101E]/40 transition-colors">
          <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
            <span>01 / METHOD PREFERENCE</span>
            <span className="text-twin-cyan font-mono">P(M)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-twin-white tracking-tight">
              {topMethodName}
            </span>
            <span className="text-xl font-bold text-twin-cyan">
              <AnimatedNumber value={topMethodPercent} decimals={1} />%
            </span>
          </div>
          <p className="text-[11px] text-twin-slate/80 font-light truncate">
            Dominant merchant checkout rail
          </p>
        </div>

        {/* Cell 02: Success Dynamics */}
        <div className="p-5 space-y-2 hover:bg-[#0B101E]/40 transition-colors">
          <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
            <span>02 / SUCCESS DYNAMICS</span>
            <TrendingUp className="w-3.5 h-3.5 text-twin-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-twin-white tracking-tight">
              {topMethodName}
            </span>
            <span className="text-xl font-bold text-twin-success">
              <AnimatedNumber value={topCaptureRate} decimals={1} />%
            </span>
          </div>
          <p className="text-[11px] text-twin-slate/80 font-light truncate">
            {topCi ? `Wilson 95% CI: [${(topCi[0] * 100).toFixed(1)}%–${(topCi[1] * 100).toFixed(1)}%]` : "Wilson 95% error bounds"}
          </p>
        </div>

        {/* Cell 03: Ticket Size */}
        <div className="p-5 space-y-2 hover:bg-[#0B101E]/40 transition-colors">
          <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
            <span>03 / TICKET SIZE</span>
            <DollarSign className="w-3.5 h-3.5 text-twin-indigo" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-twin-slate uppercase font-bold">MEDIAN</span>
            <span className="text-2xl font-bold font-display text-twin-white tracking-tight">
              ₹<AnimatedNumber value={medianAmount} decimals={0} />
            </span>
          </div>
          <p className="text-[11px] text-twin-slate/80 font-light truncate">
            Mean: ₹{meanAmount.toFixed(0)} | IQR: ₹{profile.amount_distribution.summary?.iqr.toFixed(0) ?? "—"}
          </p>
        </div>

        {/* Cell 04: Failure + Retry */}
        <div className="p-5 space-y-2 hover:bg-[#0B101E]/40 transition-colors">
          <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
            <span>04 / FAILURE + RETRY</span>
            <RotateCcw className="w-3.5 h-3.5 text-twin-warning" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-twin-slate uppercase font-bold">RETRY</span>
            <span className="text-2xl font-bold font-display text-twin-white tracking-tight">
              {retryPropensity !== null ? (
                <>
                  <AnimatedNumber value={retryPropensity} decimals={1} />%
                </>
              ) : (
                "Unobserved"
              )}
            </span>
          </div>
          <p className="text-[11px] text-twin-slate/80 font-light truncate">
            {switchPropensity !== null ? `Method switch on retry: ${switchPropensity.toFixed(1)}%` : "Observed retry transitions"}
          </p>
        </div>
      </div>
    </div>
  );
};
