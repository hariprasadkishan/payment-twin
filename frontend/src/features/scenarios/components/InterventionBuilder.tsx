import React from "react";
import { Slider } from "@/components/ui/Slider";
import { Sliders, RefreshCw, Zap, TrendingUp, RotateCcw, ArrowRightLeft, DollarSign, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterventionBuilderProps {
  upiDelta: number;
  onUpiDeltaChange: (val: number) => void;
  cardDelta: number;
  onCardDeltaChange: (val: number) => void;
  routingShift: number;
  onRoutingShiftChange: (val: number) => void;
  maxRetries: number;
  onMaxRetriesChange: (val: number) => void;
  cardMdrRate: number;
  onCardMdrRateChange: (val: number) => void;
  populationSize: number;
  onPopulationSizeChange: (val: number) => void;
  randomSeed: number;
  onRandomSeedChange: (val: number) => void;
  baselineUpiRate: number;
  baselineCardRate: number;
  baselineCardMdr: number;
}

export const InterventionBuilder: React.FC<InterventionBuilderProps> = ({
  upiDelta,
  onUpiDeltaChange,
  cardDelta,
  onCardDeltaChange,
  routingShift,
  onRoutingShiftChange,
  maxRetries,
  onMaxRetriesChange,
  cardMdrRate,
  onCardMdrRateChange,
  populationSize,
  onPopulationSizeChange,
  randomSeed,
  onRandomSeedChange,
  baselineUpiRate,
  baselineCardRate,
  baselineCardMdr,
}) => {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="size-3.5 text-accent" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
              Counterfactual Intervention Levers
            </h2>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              CRN Paired Simulation
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Adjust controllable payment parameters. Common Random Numbers (CRN) isolates the mathematical delta attributable solely to your intervention.
          </p>
        </div>
      </div>

      {/* Grid of 5 Organized Levers + Common Random Numbers Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Lever 1: UPI Success Rate Shift */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-600" />
              1. UPI Success Shift
            </span>
            <span
              className={cn(
                "font-mono text-xs font-bold tabular-nums",
                upiDelta > 0 ? "text-emerald-700" : upiDelta < 0 ? "text-red-700" : "text-textSecondary"
              )}
            >
              {upiDelta > 0 ? "+" : ""}{(upiDelta * 100).toFixed(1)}% Δ
            </span>
          </div>

          <Slider
            value={Math.round(upiDelta * 100)}
            onChange={(val) => onUpiDeltaChange(val / 100)}
            min={-15}
            max={15}
            step={1}
            unit="%"
          />

          <div className="flex justify-between text-[10px] font-mono text-textTertiary pt-1 border-t border-hairline/60">
            <span>Baseline: {(baselineUpiRate * 100).toFixed(1)}%</span>
            <span className="text-textPrimary font-semibold">
              Scenario: {((baselineUpiRate + upiDelta) * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Models improved bank authorization agreements or fast-path OTP.
          </span>
        </div>

        {/* Lever 2: Card Success Rate Shift */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-blue-600" />
              2. Card Success Shift
            </span>
            <span
              className={cn(
                "font-mono text-xs font-bold tabular-nums",
                cardDelta > 0 ? "text-emerald-700" : cardDelta < 0 ? "text-red-700" : "text-textSecondary"
              )}
            >
              {cardDelta > 0 ? "+" : ""}{(cardDelta * 100).toFixed(1)}% Δ
            </span>
          </div>

          <Slider
            value={Math.round(cardDelta * 100)}
            onChange={(val) => onCardDeltaChange(val / 100)}
            min={-15}
            max={15}
            step={1}
            unit="%"
          />

          <div className="flex justify-between text-[10px] font-mono text-textTertiary pt-1 border-t border-hairline/60">
            <span>Baseline: {(baselineCardRate * 100).toFixed(1)}%</span>
            <span className="text-textPrimary font-semibold">
              Scenario: {((baselineCardRate + cardDelta) * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Models network tokenization or 3DS frictionless authentication.
          </span>
        </div>

        {/* Lever 3: Routing Preference Shift */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <ArrowRightLeft className="size-3.5 text-purple-600" />
              3. Payment Rail Routing
            </span>
            <span
              className={cn(
                "font-mono text-xs font-bold tabular-nums",
                routingShift !== 0 ? "text-accent" : "text-textSecondary"
              )}
            >
              {routingShift > 0 ? `+${routingShift}% UPI` : routingShift < 0 ? `${routingShift}% Cards` : "0% Balanced"}
            </span>
          </div>

          <Slider
            value={routingShift}
            onChange={onRoutingShiftChange}
            min={-30}
            max={30}
            step={5}
            unit="%"
          />

          <div className="flex justify-between text-[10px] font-mono text-textTertiary pt-1 border-t border-hairline/60">
            <span>&larr; Favor Cards</span>
            <span>Favor UPI &rarr;</span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Steers checkout rail recommendations toward lower-cost or higher-converting rails.
          </span>
        </div>

        {/* Lever 4: Retry Policy */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <RotateCcw className="size-3.5 text-emerald-600" />
              4. Max Retries Policy
            </span>
            <span className="font-mono text-xs font-bold text-textPrimary tabular-nums">
              {maxRetries === 0 ? "0 (Disabled)" : `${maxRetries} Max Retries`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onMaxRetriesChange(n)}
                className={cn(
                  "flex-1 py-1 rounded text-xs font-medium border transition-colors tabular-nums",
                  maxRetries === n
                    ? "bg-accent text-white border-accent font-semibold shadow-xs"
                    : "bg-surface border-hairline text-textSecondary hover:bg-subtle hover:text-textPrimary"
                )}
              >
                {n === 0 ? "None" : `${n}x`}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-textTertiary pt-1 border-t border-hairline/60">
            <span>Baseline: 1 retry</span>
            <span className="text-textPrimary font-semibold">
              Delta: {maxRetries - 1 > 0 ? `+${maxRetries - 1}` : maxRetries - 1} retry
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Defines retry budget before an agent encounters a terminal decline.
          </span>
        </div>

        {/* Lever 5: Card Interchange MDR Rate */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-accent" />
              5. Card Interchange MDR
            </span>
            <span className="font-mono text-xs font-bold text-textPrimary tabular-nums">
              {cardMdrRate.toFixed(2)}%
            </span>
          </div>

          <Slider
            value={cardMdrRate}
            onChange={(val) => onCardMdrRateChange(parseFloat(val.toFixed(2)))}
            min={0.80}
            max={3.00}
            step={0.05}
            formatValue={(val) => `${val.toFixed(2)}%`}
          />

          <div className="flex justify-between text-[10px] font-mono text-textTertiary pt-1 border-t border-hairline/60">
            <span>Baseline: {baselineCardMdr.toFixed(2)}%</span>
            <span className={cn("font-semibold", cardMdrRate < baselineCardMdr ? "text-emerald-700" : cardMdrRate > baselineCardMdr ? "text-red-700" : "text-textPrimary")}>
              Delta: {(cardMdrRate - baselineCardMdr) > 0 ? "+" : ""}{(cardMdrRate - baselineCardMdr).toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Interchange fee paid to payment gateways per captured credit card order.
          </span>
        </div>

        {/* Common Random Numbers Simulation Config */}
        <div className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-textPrimary flex items-center gap-1.5">
                <Layers className="size-3.5 text-textSecondary" />
                CRN Seed & Population
              </span>
              <button
                type="button"
                onClick={() => onRandomSeedChange(Math.floor(Math.random() * 9999) + 1)}
                className="inline-flex items-center gap-1 text-[10px] text-textSecondary hover:text-textPrimary border border-hairline px-1.5 py-0.5 rounded bg-surface shadow-xs"
                title="Reroll master seed"
              >
                <RefreshCw className="size-2.5" />
                <span>Reroll</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-textTertiary block uppercase font-medium">
                  CRN Seed
                </span>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => onRandomSeedChange(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 rounded border border-hairline bg-surface text-xs font-mono text-textPrimary tabular-nums focus:outline-none"
                />
              </div>

              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-textTertiary block uppercase font-medium">
                  Agents (N)
                </span>
                <select
                  value={populationSize}
                  onChange={(e) => onPopulationSizeChange(parseInt(e.target.value) || 1000)}
                  className="w-full px-2 py-1 rounded border border-hairline bg-surface text-xs font-mono text-textPrimary focus:outline-none"
                >
                  <option value={500}>500 agents</option>
                  <option value={1000}>1,000 agents</option>
                  <option value={2000}>2,000 agents</option>
                  <option value={3000}>3,000 agents</option>
                </select>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-textTertiary block pt-1 border-t border-hairline/60">
            Paired execution under Common Random Numbers (CRN) isolates variance across counterfactual runs.
          </span>
        </div>
      </div>
    </section>
  );
};
