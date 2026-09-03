import React from "react";
import { Slider } from "@/components/ui/Slider";
import { ShieldCheck, Sliders, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConstraintsAndSearchSpaceProps {
  minConversion: number;
  onMinConversionChange: (val: number) => void;
  maxFailureRate: number;
  onMaxFailureRateChange: (val: number) => void;
  maxMdrFees: number;
  onMaxMdrFeesChange: (val: number) => void;
  enableConstraints: boolean;
  onToggleConstraints: () => void;
  populationSize: number;
  onPopulationSizeChange: (val: number) => void;
  randomSeed: number;
  onRandomSeedChange: (val: number) => void;
  candidateCount: number;
}

export const ConstraintsAndSearchSpace: React.FC<ConstraintsAndSearchSpaceProps> = ({
  minConversion,
  onMinConversionChange,
  maxFailureRate,
  onMaxFailureRateChange,
  maxMdrFees,
  onMaxMdrFeesChange,
  enableConstraints,
  onToggleConstraints,
  populationSize,
  onPopulationSizeChange,
  randomSeed,
  onRandomSeedChange,
  candidateCount,
}) => {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="size-3.5 text-accent" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
              Feasibility Constraints & Search Space Configuration
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary font-semibold">
              {candidateCount} Operating Points ({3}×{3}×{3} Grid)
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Defines merchant operational guardrails and the discrete policy intervention matrix across which Pareto efficiency is calculated.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleConstraints}
          className={cn(
            "text-xs font-medium px-2 py-1 rounded border transition-colors self-start sm:self-center font-mono",
            enableConstraints
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-canvas text-textTertiary border-hairline hover:text-textPrimary"
          )}
        >
          {enableConstraints ? "✓ Hard Constraints Active" : "○ Constraints Disabled"}
        </button>
      </div>

      {/* Constraints Grid (if active) + Search Space Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Hard Operational Guardrails */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-hairline/60 pb-1.5">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5 text-xs">
              <ShieldCheck className="size-3.5 text-accent" />
              Hard Operational Constraints (Feasibility Gate)
            </span>
            <span className="text-[10px] font-mono text-textTertiary">
              Violated candidates pruned
            </span>
          </div>

          <div className={cn("space-y-3 transition-opacity", !enableConstraints && "opacity-40 pointer-events-none")}>
            {/* Constraint 1: Min Conversion */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary text-[11px] font-sans">1. Min Conversion Rate:</span>
                <span className="text-textPrimary font-bold tabular-nums">≥ {minConversion}%</span>
              </div>
              <Slider
                value={minConversion}
                onChange={onMinConversionChange}
                min={70}
                max={92}
                step={1}
                unit="%"
              />
            </div>

            {/* Constraint 2: Max Failure Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary text-[11px] font-sans">2. Max Terminal Failure:</span>
                <span className="text-textPrimary font-bold tabular-nums">≤ {maxFailureRate}%</span>
              </div>
              <Slider
                value={maxFailureRate}
                onChange={onMaxFailureRateChange}
                min={5}
                max={25}
                step={1}
                unit="%"
              />
            </div>

            {/* Constraint 3: Max Processing Fees */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary text-[11px] font-sans">3. Max Processing Fees:</span>
                <span className="text-textPrimary font-bold tabular-nums">≤ ₹{maxMdrFees.toLocaleString()}</span>
              </div>
              <Slider
                value={maxMdrFees}
                onChange={onMaxMdrFeesChange}
                min={5000}
                max={25000}
                step={1000}
                unit=" INR"
              />
            </div>
          </div>
        </div>

        {/* Right: Policy Grid Space & Population */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-hairline/60 pb-1.5">
              <span className="font-semibold text-textPrimary text-xs">
                Candidate Policy Search Space (Cartesian Grid)
              </span>
              <span className="text-[10px] font-mono text-textTertiary">
                3 Dimensions
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-surface border border-hairline flex items-center justify-between">
                <span className="text-textSecondary text-[11px] font-sans">UPI Success Rate:</span>
                <span className="font-bold text-textPrimary">[85.0%, 90.0%, 95.0%]</span>
              </div>

              <div className="p-2 rounded bg-surface border border-hairline flex items-center justify-between">
                <span className="text-textSecondary text-[11px] font-sans">Card Interchange MDR:</span>
                <span className="font-bold text-textPrimary">[1.20%, 1.85%, 2.50%]</span>
              </div>

              <div className="p-2 rounded bg-surface border border-hairline flex items-center justify-between">
                <span className="text-textSecondary text-[11px] font-sans">Max Retries Policy:</span>
                <span className="font-bold text-textPrimary">[1 retry, 2 retries, 3 retries]</span>
              </div>
            </div>
          </div>

          {/* CRN Seed & Population Controls */}
          <div className="pt-2 border-t border-hairline/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-textSecondary text-[11px]">CRN Seed:</span>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => onRandomSeedChange(parseInt(e.target.value) || 0)}
                className="w-16 px-1.5 py-0.5 rounded border border-hairline bg-surface text-xs font-mono text-textPrimary tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onRandomSeedChange(Math.floor(Math.random() * 9999) + 1)}
                className="p-1 rounded border border-hairline bg-surface hover:bg-subtle text-textSecondary"
                title="Reroll seed"
              >
                <RefreshCw className="size-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-textSecondary text-[11px]">Population:</span>
              <select
                value={populationSize}
                onChange={(e) => onPopulationSizeChange(parseInt(e.target.value) || 1000)}
                className="px-2 py-0.5 rounded border border-hairline bg-surface text-xs font-mono text-textPrimary focus:outline-none"
              >
                <option value={500}>500 agents</option>
                <option value={1000}>1,000 agents</option>
                <option value={2000}>2,000 agents</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
