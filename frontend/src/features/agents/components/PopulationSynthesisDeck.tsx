import React from "react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Sliders, RefreshCw, Dna } from "lucide-react";

interface PopulationSynthesisDeckProps {
  populationSize: number;
  onPopulationSizeChange: (val: number) => void;
  randomSeed: number;
  onRandomSeedChange: (val: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  profilingAvailable?: boolean;
}

export const PopulationSynthesisDeck: React.FC<PopulationSynthesisDeckProps> = ({
  populationSize,
  onPopulationSizeChange,
  randomSeed,
  onRandomSeedChange,
  isGenerating,
  onGenerate,
  profilingAvailable = true,
}) => {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
      {/* Instrumentation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="size-3.5 text-accent" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
              Population Sampler
            </h2>
            <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              <Dna className="size-3" />
              CRN Active
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-normal max-w-2xl">
            Sample autonomous payment actors from calibrated Behavioral DNA distributions with deterministic random seeds.
          </p>
        </div>

        {/* Primary Sampling CTA */}
        <Button
          variant="primary"
          size="sm"
          isLoading={isGenerating}
          disabled={!profilingAvailable}
          onClick={onGenerate}
          className="whitespace-nowrap self-start sm:self-center shadow-sm"
        >
          Generate Population
        </Button>
      </div>

      {/* Control Deck Grid - Open hierarchy without nested bordered boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-0.5 items-center">
        {/* Population Slider (7 cols) */}
        <div className="sm:col-span-7 space-y-2 pr-0 sm:pr-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-textSecondary uppercase tracking-wider">
              Population Size (N)
            </span>
            <span className="text-xs font-semibold text-textPrimary tabular-nums">
              {populationSize.toLocaleString()} agents
            </span>
          </div>

          <Slider
            label=""
            value={populationSize}
            onChange={onPopulationSizeChange}
            min={100}
            max={5000}
            step={100}
            unit=" agents"
          />

          <div className="flex justify-between text-[10px] text-textTertiary">
            <span>Min: 100</span>
            <span>Default: 1,000</span>
            <span>Max: 5,000</span>
          </div>
        </div>

        {/* Master Seed Input (5 cols) with subtle left hairline divider on desktop */}
        <div className="sm:col-span-5 space-y-2 border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-textSecondary uppercase tracking-wider">
              Deterministic Seed
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
              CRN Paired
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => onRandomSeedChange(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded border border-hairline bg-canvas/60 text-xs font-mono text-textPrimary tabular-nums focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Master random seed"
            />
            <button
              type="button"
              onClick={() => onRandomSeedChange(Math.floor(Math.random() * 9999) + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-hairline bg-surface text-xs font-medium text-textSecondary hover:bg-subtle hover:text-textPrimary transition-colors whitespace-nowrap shadow-xs"
              title="Generate new pseudo-random master seed"
            >
              <RefreshCw className="size-3 text-textTertiary" />
              <span>Reroll</span>
            </button>
          </div>

          <p className="text-[10px] text-textTertiary truncate">
            Fixes pseudo-random sequence for paired counterfactual testing
          </p>
        </div>
      </div>
    </div>
  );
};


