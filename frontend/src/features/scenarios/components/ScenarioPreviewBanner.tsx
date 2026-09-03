import React from "react";
import { ArrowRight, Eye, CheckCircle2 } from "lucide-react";

interface ScenarioPreviewBannerProps {
  upiDelta: number;
  cardDelta: number;
  routingShift: number;
  maxRetries: number;
  cardMdrRate: number;
  baselineUpiRate: number;
  baselineCardRate: number;
  baselineCardMdr: number;
}

export const ScenarioPreviewBanner: React.FC<ScenarioPreviewBannerProps> = ({
  upiDelta,
  cardDelta,
  routingShift,
  maxRetries,
  cardMdrRate,
  baselineUpiRate,
  baselineCardRate,
  baselineCardMdr,
}) => {
  const changes: { name: string; baseline: string; counterfactual: string }[] = [];

  if (upiDelta !== 0) {
    changes.push({
      name: "UPI Success Rate",
      baseline: `${(baselineUpiRate * 100).toFixed(1)}%`,
      counterfactual: `${((baselineUpiRate + upiDelta) * 100).toFixed(1)}% (${upiDelta > 0 ? "+" : ""}${(upiDelta * 100).toFixed(1)}%)`,
    });
  }

  if (cardDelta !== 0) {
    changes.push({
      name: "Card Success Rate",
      baseline: `${(baselineCardRate * 100).toFixed(1)}%`,
      counterfactual: `${((baselineCardRate + cardDelta) * 100).toFixed(1)}% (${cardDelta > 0 ? "+" : ""}${(cardDelta * 100).toFixed(1)}%)`,
    });
  }

  if (routingShift !== 0) {
    changes.push({
      name: "Rail Routing",
      baseline: "Empirical Mix",
      counterfactual: routingShift > 0 ? `+${routingShift}% shifted to UPI` : `${Math.abs(routingShift)}% shifted to Cards`,
    });
  }

  if (maxRetries !== 1) {
    changes.push({
      name: "Retry Policy",
      baseline: "1 Max Retry",
      counterfactual: maxRetries === 0 ? "0 (No Retries)" : `${maxRetries} Max Retries`,
    });
  }

  if (cardMdrRate !== baselineCardMdr) {
    changes.push({
      name: "Card MDR Rate",
      baseline: `${baselineCardMdr.toFixed(2)}%`,
      counterfactual: `${cardMdrRate.toFixed(2)}% (${(cardMdrRate - baselineCardMdr) > 0 ? "+" : ""}${(cardMdrRate - baselineCardMdr).toFixed(2)}%)`,
    });
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-3 shadow-panel space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Eye className="size-3.5 text-textSecondary" />
          <span className="font-semibold text-textPrimary text-xs">
            Pre-Flight Configuration Preview: Baseline vs Counterfactual
          </span>
        </div>
        <span className="text-[10px] font-mono text-textTertiary">
          {changes.length === 0 ? "No active policy overrides (Neutral Baseline)" : `${changes.length} active policy override(s)`}
        </span>
      </div>

      {changes.length === 0 ? (
        <div className="py-2 px-3 rounded bg-canvas/60 border border-hairline text-xs text-textSecondary flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-textTertiary" />
          <span>No levers modified from baseline. Adjust any lever above or run to test nominal conditions.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {changes.map((c) => (
            <div
              key={c.name}
              className="p-2.5 rounded bg-canvas/60 border border-hairline space-y-1 text-xs font-mono"
            >
              <span className="font-sans text-[11px] font-medium text-textSecondary block">
                {c.name}
              </span>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-textTertiary tabular-nums">{c.baseline}</span>
                <ArrowRight className="size-3 text-textTertiary" />
                <span className="font-bold text-accent tabular-nums">{c.counterfactual}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
