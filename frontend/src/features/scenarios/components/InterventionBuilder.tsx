import React from "react";
import { Slider } from "@/components/ui/Slider";
import { Sliders, RefreshCw, Zap, TrendingUp, RotateCcw, ArrowRightLeft, DollarSign, Layers, ArrowRight } from "lucide-react";
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
  // Count active modifications
  const changes: string[] = [];
  if (upiDelta !== 0) changes.push(`UPI Success (${upiDelta > 0 ? "+" : ""}${(upiDelta * 100).toFixed(1)}%)`);
  if (cardDelta !== 0) changes.push(`Card Success (${cardDelta > 0 ? "+" : ""}${(cardDelta * 100).toFixed(1)}%)`);
  if (routingShift !== 0) changes.push(`Routing (${routingShift > 0 ? `+${routingShift}% UPI` : `${routingShift}% Card`})`);
  if (maxRetries !== 1) changes.push(`Retries (${maxRetries}x)`);
  if (Math.abs(cardMdrRate - baselineCardMdr) > 0.001) changes.push(`MDR (${cardMdrRate.toFixed(2)}%)`);

  const hasChanges = changes.length > 0;

  return (
    <section
      aria-label="Scenario Control Strip: Baseline vs Counterfactual Levers"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      {/* Top Bar: Control Strip Header & Change Summary */}
      <div className="p-3.5 sm:p-4 bg-canvas/30 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Sliders className="size-3.5 text-accent" strokeWidth={1.75} />
              <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
                SCENARIO CONTROL STRIP · BASELINE vs COUNTERFACTUAL
              </h2>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary whitespace-nowrap">
              Common Random Numbers (CRN)
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Adjust one controllable parameter to isolate counterfactual impact against baseline empirical DNA.
          </p>
        </div>

        {/* Changed Levers Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 max-w-full">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border max-w-full",
              hasChanges
                ? "border-blue-200 bg-blue-50 text-accent font-semibold"
                : "border-hairline bg-canvas text-textTertiary"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                hasChanges ? "bg-accent animate-pulse" : "bg-textTertiary"
              )}
            />
            <span className="truncate">
              {hasChanges
                ? `${changes.length} Modified Lever${changes.length > 1 ? "s" : ""}: ${changes.join(", ")}`
                : "All Levers At Baseline (Nominal)"}
            </span>
          </span>
        </div>
      </div>

      {/* Grid of 5 Levers + CRN Simulation Settings */}
      <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* LEVER 1: UPI Success Rate Shift */}
        <div
          className={cn(
            "p-3 rounded-md border transition-all space-y-2.5",
            upiDelta !== 0
              ? "border-accent/60 bg-blue-50/20 ring-1 ring-accent/20 shadow-xs"
              : "border-hairline bg-canvas/30"
          )}
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-600" />
              1. UPI Success Shift
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border tabular-nums",
                upiDelta !== 0
                  ? "bg-blue-50 text-accent border-blue-200"
                  : "bg-surface text-textTertiary border-hairline"
              )}
            >
              {upiDelta !== 0 ? `${upiDelta > 0 ? "+" : ""}${(upiDelta * 100).toFixed(1)}% Δ` : "Baseline"}
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

          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-hairline/60">
            <span className="text-textTertiary">
              Baseline: <strong className="text-textSecondary font-semibold">{(baselineUpiRate * 100).toFixed(1)}%</strong>
            </span>
            <ArrowRight className="size-2.5 text-textTertiary" />
            <span className={cn("font-bold", upiDelta !== 0 ? "text-accent" : "text-textSecondary")}>
              Counterfactual: {((baselineUpiRate + upiDelta) * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Models bank authorization agreements or fast-path OTP.
          </span>
        </div>

        {/* LEVER 2: Card Success Rate Shift */}
        <div
          className={cn(
            "p-3 rounded-md border transition-all space-y-2.5",
            cardDelta !== 0
              ? "border-accent/60 bg-blue-50/20 ring-1 ring-accent/20 shadow-xs"
              : "border-hairline bg-canvas/30"
          )}
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-blue-600" />
              2. Card Success Shift
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border tabular-nums",
                cardDelta !== 0
                  ? "bg-blue-50 text-accent border-blue-200"
                  : "bg-surface text-textTertiary border-hairline"
              )}
            >
              {cardDelta !== 0 ? `${cardDelta > 0 ? "+" : ""}${(cardDelta * 100).toFixed(1)}% Δ` : "Baseline"}
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

          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-hairline/60">
            <span className="text-textTertiary">
              Baseline: <strong className="text-textSecondary font-semibold">{(baselineCardRate * 100).toFixed(1)}%</strong>
            </span>
            <ArrowRight className="size-2.5 text-textTertiary" />
            <span className={cn("font-bold", cardDelta !== 0 ? "text-accent" : "text-textSecondary")}>
              Counterfactual: {((baselineCardRate + cardDelta) * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Models network tokenization or 3DS frictionless authentication.
          </span>
        </div>

        {/* LEVER 3: Payment Rail Routing Preference */}
        <div
          className={cn(
            "p-3 rounded-md border transition-all space-y-2.5",
            routingShift !== 0
              ? "border-accent/60 bg-blue-50/20 ring-1 ring-accent/20 shadow-xs"
              : "border-hairline bg-canvas/30"
          )}
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <ArrowRightLeft className="size-3.5 text-purple-600" />
              3. Rail Routing Preference
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border tabular-nums",
                routingShift !== 0
                  ? "bg-blue-50 text-accent border-blue-200"
                  : "bg-surface text-textTertiary border-hairline"
              )}
            >
              {routingShift > 0 ? `+${routingShift}% UPI` : routingShift < 0 ? `${routingShift}% Cards` : "Baseline Mix"}
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

          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-hairline/60">
            <span className="text-textTertiary">&larr; Favor Cards</span>
            <span className={cn("font-bold", routingShift !== 0 ? "text-accent" : "text-textSecondary")}>
              {routingShift === 0 ? "Empirical Mix" : routingShift > 0 ? `+${routingShift}% UPI` : `${routingShift}% Cards`}
            </span>
            <span className="text-textTertiary">Favor UPI &rarr;</span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Steers checkout rail recommendations toward lower-cost or higher-converting rails.
          </span>
        </div>

        {/* LEVER 4: Max Retries Budget */}
        <div
          className={cn(
            "p-3 rounded-md border transition-all space-y-2.5",
            maxRetries !== 1
              ? "border-accent/60 bg-blue-50/20 ring-1 ring-accent/20 shadow-xs"
              : "border-hairline bg-canvas/30"
          )}
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <RotateCcw className="size-3.5 text-emerald-600" />
              4. Max Retries Budget
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border tabular-nums",
                maxRetries !== 1
                  ? "bg-blue-50 text-accent border-blue-200"
                  : "bg-surface text-textTertiary border-hairline"
              )}
            >
              {maxRetries !== 1 ? `${maxRetries}x Retries` : "Baseline (1x)"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
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

          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-hairline/60">
            <span className="text-textTertiary">
              Baseline: <strong className="text-textSecondary font-semibold">1 retry</strong>
            </span>
            <ArrowRight className="size-2.5 text-textTertiary" />
            <span className={cn("font-bold", maxRetries !== 1 ? "text-accent" : "text-textSecondary")}>
              Delta: {maxRetries - 1 > 0 ? `+${maxRetries - 1}` : maxRetries - 1} retry
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Defines maximum retry attempts allowed before an agent encounters a terminal decline.
          </span>
        </div>

        {/* LEVER 5: Card Interchange MDR Rate */}
        <div
          className={cn(
            "p-3 rounded-md border transition-all space-y-2.5",
            Math.abs(cardMdrRate - baselineCardMdr) > 0.001
              ? "border-accent/60 bg-blue-50/20 ring-1 ring-accent/20 shadow-xs"
              : "border-hairline bg-canvas/30"
          )}
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-accent" />
              5. Card Interchange MDR
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border tabular-nums",
                Math.abs(cardMdrRate - baselineCardMdr) > 0.001
                  ? "bg-blue-50 text-accent border-blue-200"
                  : "bg-surface text-textTertiary border-hairline"
              )}
            >
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

          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-hairline/60">
            <span className="text-textTertiary">
              Baseline: <strong className="text-textSecondary font-semibold">{baselineCardMdr.toFixed(2)}%</strong>
            </span>
            <ArrowRight className="size-2.5 text-textTertiary" />
            <span className={cn("font-bold", cardMdrRate < baselineCardMdr ? "text-emerald-700" : cardMdrRate > baselineCardMdr ? "text-red-700" : "text-textSecondary")}>
              Delta: {(cardMdrRate - baselineCardMdr) > 0 ? "+" : ""}{(cardMdrRate - baselineCardMdr).toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-textTertiary block">
            Interchange fee paid to payment gateways per captured credit card transaction.
          </span>
        </div>

        {/* LEVER 6: CRN Seed & Population (Paired Variance Isolation) */}
        <div className="p-3 rounded-md border border-hairline bg-canvas/30 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-textPrimary flex items-center gap-1.5">
                <Layers className="size-3.5 text-textSecondary" />
                CRN Seed & Population
              </span>
              <button
                type="button"
                onClick={() => onRandomSeedChange(Math.floor(Math.random() * 9999) + 1)}
                className="inline-flex items-center gap-1 text-[10px] text-textSecondary hover:text-textPrimary border border-hairline px-1.5 py-0.5 rounded bg-surface shadow-xs transition-colors"
                title="Reroll master seed"
              >
                <RefreshCw className="size-2.5" />
                <span>Reroll</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-textTertiary block uppercase font-mono font-medium">
                  CRN Seed
                </span>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => onRandomSeedChange(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 rounded border border-hairline bg-surface text-xs font-mono text-textPrimary tabular-nums focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-textTertiary block uppercase font-mono font-medium">
                  Agents (N)
                </span>
                <select
                  value={populationSize}
                  onChange={(e) => onPopulationSizeChange(parseInt(e.target.value) || 1000)}
                  className="w-full px-2 py-1 rounded border border-hairline bg-surface text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
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
            Paired execution under Common Random Numbers (CRN) isolates pure counterfactual delta.
          </span>
        </div>
      </div>
    </section>
  );
};
