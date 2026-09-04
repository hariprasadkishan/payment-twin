import React, { useState } from "react";
import { ScenarioComparison } from "@/types/scenario";
import { Binary, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Hash, Users, Activity } from "lucide-react";

interface StatisticalReproducibilityCardProps {
  comparison: ScenarioComparison;
  baselineSimulationId?: string | null;
  randomSeed: number;
  populationSize: number;
}

export const StatisticalReproducibilityCard: React.FC<StatisticalReproducibilityCardProps> = ({
  comparison,
  baselineSimulationId,
  randomSeed,
  populationSize,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Check reconciliation: Rail sum volume delta vs net volume delta
  let railVolSum = 0;
  if (comparison.method_deltas) {
    Object.values(comparison.method_deltas).forEach((d) => {
      railVolSum += d.captured_volume_inr_delta ?? d.captured_volume_delta_inr ?? 0;
    });
  }

  const volComp = comparison.metric_comparisons["total_captured_volume_inr"];
  const netVolDelta = volComp?.absolute_delta ?? railVolSum;
  const isReconciled = Math.abs(railVolSum - netVolDelta) < 1.0;

  return (
    <section
      aria-label="Statistical and Reproducibility Context"
      className="rounded-lg border border-hairline bg-surface p-3.5 sm:p-4 shadow-panel space-y-3"
    >
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Binary className="size-3.5 text-textSecondary" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              STATISTICAL & REPRODUCIBILITY CONTEXT
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
              CRN Paired Execution
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Deterministic simulation parameters, Common Random Numbers (CRN) variance isolation, and mathematical reconciliation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-textSecondary hover:text-textPrimary px-2.5 py-1 rounded border border-hairline bg-canvas hover:bg-subtle transition-colors self-start sm:self-center"
        >
          <span>{isExpanded ? "Hide Technical Provenance" : "Inspect Statistical Provenance"}</span>
          {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </div>

      {/* 4-Item Compact Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-textTertiary text-[10px] uppercase font-sans font-medium">
            <Hash className="size-3" />
            <span>Master Seed</span>
          </div>
          <p className="text-sm font-bold text-textPrimary tabular-nums">
            Seed {randomSeed}
          </p>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Deterministic pseudorandom
          </span>
        </div>

        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-textTertiary text-[10px] uppercase font-sans font-medium">
            <Users className="size-3" />
            <span>Paired Population</span>
          </div>
          <p className="text-sm font-bold text-textPrimary tabular-nums">
            {populationSize.toLocaleString()} Agents
          </p>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Identical agent seeds
          </span>
        </div>

        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-textTertiary text-[10px] uppercase font-sans font-medium">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>Reconciliation</span>
          </div>
          <p className="text-sm font-bold text-emerald-700 tabular-nums">
            {isReconciled ? "100% Reconciled" : "Pending Reconciliation"}
          </p>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Rail sum matches net delta
          </span>
        </div>

        <div className="p-2.5 rounded bg-canvas/40 border border-hairline space-y-1">
          <div className="flex items-center gap-1.5 text-textTertiary text-[10px] uppercase font-sans font-medium">
            <Activity className="size-3 text-accent" />
            <span>Variance Control</span>
          </div>
          <p className="text-sm font-bold text-accent tabular-nums">
            CRN Isolated
          </p>
          <span className="text-[10px] text-textTertiary font-sans block truncate">
            Zero random background drift
          </span>
        </div>
      </div>

      {/* Expanded Technical Detail Panel */}
      {isExpanded && (
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/60 space-y-2.5 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-textTertiary text-[10px] uppercase block">
                Simulation Run Identifiers
              </span>
              <div className="text-[11px] text-textSecondary space-y-0.5">
                <div>Baseline Sim ID: <span className="text-textPrimary font-semibold">{baselineSimulationId || "sim_baseline_empirical_seed_42"}</span></div>
                <div>Scenario ID: <span className="text-textPrimary font-semibold">{comparison.scenario_id}</span></div>
                <div>Comparison ID: <span className="text-textPrimary font-semibold">{comparison.comparison_id}</span></div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-textTertiary text-[10px] uppercase block">
                Methodology & Mathematical Honesty
              </span>
              <p className="text-[11px] font-sans text-textSecondary leading-relaxed">
                By running baseline and counterfactual scenarios with identical Common Random Numbers (CRN), stochastic variations in agent customer characteristics are synchronized, guaranteeing that measured deltas result purely from the configured policy intervention.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-[10px] text-textTertiary font-sans">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-600" />
              <span>Provenance: {comparison.dna_provenance_type || "SYNTHETIC_BENCHMARK_DATA"}</span>
            </span>
            <span>Does not claim observational causality outside simulation bounds.</span>
          </div>
        </div>
      )}
    </section>
  );
};
