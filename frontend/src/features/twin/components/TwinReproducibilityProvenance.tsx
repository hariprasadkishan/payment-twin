import React from "react";
import { Dna, ShieldCheck, RefreshCw, Hash, Database } from "lucide-react";

interface TwinReproducibilityProvenanceProps {
  simulationId?: string;
  randomSeed: number;
  populationSize: number;
  dnaVersion?: string;
  provenanceType?: string;
  executionDurationMs?: number;
}

export const TwinReproducibilityProvenance: React.FC<TwinReproducibilityProvenanceProps> = ({
  simulationId,
  randomSeed,
  populationSize,
  dnaVersion = "1.0.0",
  provenanceType = "SYNTHETIC_BENCHMARK_DATA",
  executionDurationMs,
}) => {
  return (
    <section
      aria-label="Simulation Determinism and Provenance Panel"
      className="rounded-lg border border-hairline bg-surface p-4 sm:p-5 shadow-panel space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Dna className="size-4 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
              Simulation Provenance & Deterministic Seed Guarantee
            </h3>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-accent">
              Common Random Numbers (CRN)
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Payment Twin uses a seeded Pseudo-Random Number Generator (PRNG). Holding the random seed constant isolates policy effect from stochastic variance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-textTertiary self-start sm:self-center">
          <span>Same Seed + Same Config = Exact Match</span>
        </div>
      </div>

      {/* Provenance Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
        <div className="p-2.5 rounded-md bg-canvas/60 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-textTertiary uppercase tracking-wider">
            <Hash className="size-3 text-accent" />
            <span>Random Seed</span>
          </div>
          <p className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            {randomSeed}
          </p>
          <span className="text-[10px] text-textTertiary block">Deterministic PRNG Key</span>
        </div>

        <div className="p-2.5 rounded-md bg-canvas/60 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-textTertiary uppercase tracking-wider">
            <Database className="size-3 text-accent" />
            <span>Behavioral DNA</span>
          </div>
          <p className="text-sm font-bold font-mono text-textPrimary">
            v{dnaVersion}
          </p>
          <span className="text-[10px] text-textTertiary block truncate" title={provenanceType}>
            {provenanceType.replace(/_/g, " ")}
          </span>
        </div>

        <div className="p-2.5 rounded-md bg-canvas/60 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-textTertiary uppercase tracking-wider">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>Population Scope</span>
          </div>
          <p className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            N = {populationSize.toLocaleString()}
          </p>
          <span className="text-[10px] text-textTertiary block">Calibrated Synthetic Agents</span>
        </div>

        <div className="p-2.5 rounded-md bg-canvas/60 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-textTertiary uppercase tracking-wider">
            <RefreshCw className="size-3 text-accent" />
            <span>Runtime Latency</span>
          </div>
          <p className="text-sm font-bold font-mono text-textPrimary tabular-nums">
            {executionDurationMs ? `${executionDurationMs.toFixed(1)} ms` : "—"}
          </p>
          <span className="text-[10px] text-textTertiary block">Discrete Event Loop</span>
        </div>

        <div className="p-2.5 rounded-md bg-canvas/60 border border-hairline space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-textTertiary uppercase tracking-wider">
            <span>Simulation ID</span>
          </div>
          <p className="text-xs font-mono font-bold text-textSecondary truncate" title={simulationId}>
            {simulationId || "sim_default"}
          </p>
          <span className="text-[10px] text-textTertiary block truncate">Immutable Run Hash</span>
        </div>
      </div>

      {/* Honest Tripartite Distinction */}
      <div className="pt-2 border-t border-hairline/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-textSecondary">
        <div className="flex items-center gap-3 flex-wrap">
          <span><strong className="text-textPrimary font-semibold">1. Observed:</strong> Historical Razorpay payment records</span>
          <span>→</span>
          <span><strong className="text-textPrimary font-semibold">2. Synthetic:</strong> Customer Agents sampled from DNA</span>
          <span>→</span>
          <span><strong className="text-accent font-semibold">3. Simulated:</strong> Forward counterfactual funnel outcomes</span>
        </div>
      </div>
    </section>
  );
};
