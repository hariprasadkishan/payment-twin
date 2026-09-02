import React from "react";
import { BehavioralDNAProfile } from "@/types/dna";
import { AlertOctagon, RotateCcw, Shuffle, Info } from "lucide-react";

interface FailureSignatureProps {
  profile: BehavioralDNAProfile;
}

export const FailureSignature: React.FC<FailureSignatureProps> = ({ profile }) => {
  const errorSources = profile.failure_diagnostics.error_source_distribution || {};
  const transitions = profile.empirical_transitions;

  const retryPropensity = transitions.overall_retry_probability_on_failure !== null &&
    transitions.overall_retry_probability_on_failure !== undefined
      ? (transitions.overall_retry_probability_on_failure * 100).toFixed(1)
      : null;

  const switchPropensity = transitions.method_switch_on_retry_probability !== null &&
    transitions.method_switch_on_retry_probability !== undefined
      ? (transitions.method_switch_on_retry_probability * 100).toFixed(1)
      : null;

  return (
    <section className="rounded-xl border border-twin-border/90 bg-[#080B12]/95 shadow-xl overflow-hidden space-y-6 p-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-twin-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-twin-danger" />
            <h3 className="text-base font-display font-bold text-twin-white tracking-tight">
              FAILURE SIGNATURE & TRANSITION ASSOCIATIONS
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-danger/15 border border-twin-danger/30 text-twin-danger font-semibold uppercase tracking-wider">
              EMPIRICAL RECOVERY LOGIC
            </span>
          </div>
          <p className="text-xs text-twin-slate font-light">
            Observed transition association across failure origins and retry reactions. Non-causal empirical behavioral prior.
          </p>
        </div>

        <div className="text-right font-mono text-[11px] text-twin-slate">
          <span>FAILED SAMPLES: </span>
          <span className="font-bold text-twin-danger">
            {profile.failure_diagnostics.failed_sample_size.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Visual Pipeline: Failure Source -> Retry Response -> Method Switch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs items-stretch relative">
        {/* Stage 1: Failure Source */}
        <div className="p-4 rounded-xl bg-twin-card/40 border border-twin-border/80 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
              <span>01 / FAILURE ORIGIN</span>
              <AlertOctagon className="w-3.5 h-3.5 text-twin-danger" />
            </div>
            <div className="text-xs text-twin-slate font-light">
              Attributed technical root categories
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {Object.entries(errorSources).map(([source, share]) => {
              const pct = (share * 100).toFixed(1);
              return (
                <div key={source} className="p-2.5 rounded-lg bg-twin-card/60 border border-twin-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-twin-slate capitalize">{source}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-twin-card/80 overflow-hidden">
                      <div
                        className="h-full bg-twin-danger rounded-full"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                    <span className="text-twin-danger font-bold w-12 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-twin-slate/70 pt-2 border-t border-twin-border/40 text-center">
            P(failure_source | failed_attempt)
          </div>
        </div>

        {/* Transition indicator (desktop horizontal arrow / mobile down arrow) */}
        <div className="hidden md:flex absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-twin-card border border-twin-border text-twin-slate">
          &rarr;
        </div>

        {/* Stage 2: Retry Response */}
        <div className="p-4 rounded-xl bg-twin-card/40 border border-twin-border/80 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
              <span>02 / RETRY RESPONSE</span>
              <RotateCcw className="w-3.5 h-3.5 text-twin-warning" />
            </div>
            <div className="text-xs text-twin-slate font-light">
              Observed re-attempt propensity
            </div>
          </div>

          <div className="py-4 text-center space-y-2">
            <div className="text-3xl font-display font-bold text-twin-white tracking-tight">
              {retryPropensity !== null ? `${retryPropensity}%` : "Unobserved"}
            </div>
            <p className="text-[11px] text-twin-slate/85 font-light">
              Orders exhibiting &gt;1 attempt prior to terminal outcome
            </p>
            <div className="inline-block px-2.5 py-1 rounded bg-twin-warning/10 border border-twin-warning/30 text-[10px] text-twin-warning font-semibold">
              {transitions.multi_attempt_orders_count.toLocaleString()} / {transitions.tracked_orders_count.toLocaleString()} MULTI-ATTEMPT
            </div>
          </div>

          <div className="text-[10px] text-twin-slate/70 pt-2 border-t border-twin-border/40 text-center">
            P(retry = true | attempt_declined)
          </div>
        </div>

        {/* Transition indicator 2 */}
        <div className="hidden md:flex absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-twin-card border border-twin-border text-twin-slate">
          &rarr;
        </div>

        {/* Stage 3: Method Switch */}
        <div className="p-4 rounded-xl bg-twin-card/40 border border-twin-border/80 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-twin-slate uppercase tracking-wider font-semibold">
              <span>03 / METHOD SWITCH</span>
              <Shuffle className="w-3.5 h-3.5 text-twin-cyan" />
            </div>
            <div className="text-xs text-twin-slate font-light">
              Rail substitution on re-attempt
            </div>
          </div>

          <div className="py-4 text-center space-y-2">
            <div className="text-3xl font-display font-bold text-twin-cyan tracking-tight">
              {switchPropensity !== null ? `${switchPropensity}%` : "Unobserved"}
            </div>
            <p className="text-[11px] text-twin-slate/85 font-light">
              Switching payment instrument upon immediate retry
            </p>
            <div className="inline-block px-2.5 py-1 rounded bg-twin-cyan/10 border border-twin-cyan/30 text-[10px] text-twin-cyan font-semibold">
              FALLBACK METHOD ROUTING
            </div>
          </div>

          <div className="text-[10px] text-twin-slate/70 pt-2 border-t border-twin-border/40 text-center">
            P(method_t2 != method_t1 | retry)
          </div>
        </div>
      </div>

      {/* Non-causal empirical disclaimer */}
      <div className="p-3.5 rounded-lg bg-twin-card/30 border border-twin-border/70 flex items-start gap-2.5 text-[11px] font-mono text-twin-slate">
        <Info className="w-4 h-4 text-twin-slate flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-twin-white uppercase">Observed Transition Association:</strong> {transitions.unobserved_dropouts_note || "Pre-checkout abandonment before gateway handoff is unobserved in Razorpay payment telemetry. Transition probabilities represent empirical correlations from multi-attempt order records."}
        </p>
      </div>
    </section>
  );
};
