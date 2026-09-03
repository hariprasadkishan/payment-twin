import React from "react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Sliders, RefreshCw, PlayCircle, Dna, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationControlStripProps {
  simMode: "single" | "monte_carlo";
  onSimModeChange: (mode: "single" | "monte_carlo") => void;
  populationSize: number;
  onPopulationSizeChange: (val: number) => void;
  randomSeed: number;
  onRandomSeedChange: (val: number) => void;
  monteCarloRuns: number;
  onMonteCarloRunsChange: (val: number) => void;
  isSimulating: boolean;
  onRun: () => void;
}

export const SimulationControlStrip: React.FC<SimulationControlStripProps> = ({
  simMode,
  onSimModeChange,
  populationSize,
  onPopulationSizeChange,
  randomSeed,
  onRandomSeedChange,
  monteCarloRuns,
  onMonteCarloRunsChange,
  isSimulating,
  onRun,
}) => {
  const populationPresets = [500, 1000, 2500, 5000];

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
      {/* Instrumentation Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="size-3.5 text-accent" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
              Simulation Instrument Controls
            </h2>
            <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              <Dna className="size-3" />
              CRN Master Seed
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-normal">
            Configure agent population volume, Common Random Numbers (CRN) seed for reproducible paired counterfactuals, and stochastic sweep scope.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <Tabs value={simMode} onValueChange={(val) => onSimModeChange(val as any)}>
            <TabsList>
              <TabsTrigger value="single">Single Deterministic Run</TabsTrigger>
              <TabsTrigger value="monte_carlo">Monte Carlo Sweep</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Control Grid - Open hierarchy with subtle column dividers on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Col 1: Population Size (5 cols) */}
        <div className="sm:col-span-4 space-y-2 pr-0 sm:pr-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-textSecondary uppercase tracking-wider">
              Population Size (N)
            </span>
            <span className="text-xs font-semibold text-textPrimary tabular-nums">
              {populationSize.toLocaleString()} agents
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {populationPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onPopulationSizeChange(preset)}
                className={cn(
                  "flex-1 py-1 rounded text-xs font-medium border transition-colors tabular-nums",
                  populationSize === preset
                    ? "bg-accent text-white border-accent font-semibold shadow-xs"
                    : "bg-surface border-hairline text-textSecondary hover:bg-subtle hover:text-textPrimary"
                )}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-textTertiary block">
            Stochastically sampled from Behavioral DNA distributions
          </span>
        </div>

        {/* Col 2: Master Seed (CRN) (3 cols) with desktop hairline divider */}
        <div className="sm:col-span-3 space-y-2 border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-textSecondary uppercase tracking-wider">
              Deterministic Seed
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
              CRN Paired
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => onRandomSeedChange(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1 rounded border border-hairline bg-canvas/60 text-xs font-mono text-textPrimary tabular-nums focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Master random seed"
            />
            <button
              type="button"
              onClick={() => onRandomSeedChange(Math.floor(Math.random() * 9999) + 1)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-hairline bg-surface text-xs font-medium text-textSecondary hover:bg-subtle hover:text-textPrimary transition-colors whitespace-nowrap shadow-xs"
              title="Generate new pseudo-random master seed"
            >
              <RefreshCw className="size-3 text-textTertiary" />
              <span>Reroll</span>
            </button>
          </div>

          <span className="text-[10px] text-textTertiary block truncate">
            Fixes pseudo-random sequence for A/B parity
          </span>
        </div>

        {/* Col 3: Scope / Sweeps (3 cols) with desktop hairline divider */}
        <div className="sm:col-span-3 space-y-2 border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-textSecondary uppercase tracking-wider">
              {simMode === "monte_carlo" ? "Monte Carlo Sweeps" : "Execution Model"}
            </span>
            <span className="text-xs font-semibold text-textPrimary">
              {simMode === "monte_carlo" ? `${monteCarloRuns} runs` : "Single Pass"}
            </span>
          </div>

          {simMode === "monte_carlo" ? (
            <div className="flex items-center gap-1.5">
              {[10, 20, 30, 50].map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => onMonteCarloRunsChange(runs)}
                  className={cn(
                    "flex-1 py-1 rounded text-xs font-medium border transition-colors tabular-nums",
                    monteCarloRuns === runs
                      ? "bg-accent text-white border-accent font-semibold shadow-xs"
                      : "bg-surface border-hairline text-textSecondary hover:bg-subtle hover:text-textPrimary"
                  )}
                >
                  {runs}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-1 px-2.5 rounded bg-canvas/60 border border-hairline/80 flex items-center justify-between text-xs">
              <span className="font-mono text-textPrimary text-[11px]">Discrete Event State Machine</span>
              <Layers className="size-3 text-textTertiary" />
            </div>
          )}

          <span className="text-[10px] text-textTertiary block truncate">
            {simMode === "monte_carlo" ? "Aggregates confidence intervals across runs" : "Markov agent state traversal"}
          </span>
        </div>

        {/* Col 4: Primary Run Button (2 cols) */}
        <div className="sm:col-span-2 pt-2 sm:pt-0">
          <Button
            variant="primary"
            size="md"
            isLoading={isSimulating}
            onClick={onRun}
            className="w-full shadow-sm gap-1.5 py-2 text-xs font-semibold"
          >
            <PlayCircle className="size-3.5" />
            <span>
              {isSimulating ? "Simulating..." : simMode === "single" ? "Run Simulation" : `Run Sweep (${monteCarloRuns})`}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
