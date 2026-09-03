import React from "react";
import { AlertCircle, Clock, RotateCcw, UserMinus, ShieldAlert } from "lucide-react";

interface FunnelDropoffAttributionProps {
  dropoffs: Record<string, number>;
  totalPopulation: number;
}

export const FunnelDropoffAttribution: React.FC<FunnelDropoffAttributionProps> = ({
  dropoffs,
  totalPopulation,
}) => {
  const dropoffDescriptions: Record<string, { label: string; icon: React.ElementType; explanation: string }> = {
    GAVE_UP_AFTER_DECLINE: {
      label: "Gave Up After Decline",
      icon: RotateCcw,
      explanation: "Agent encountered an initial bank decline and chose not to retry because friction sensitivity threshold was breached.",
    },
    MAX_RETRIES_EXCEEDED: {
      label: "Max Retries Exceeded",
      icon: ShieldAlert,
      explanation: "Patient transactor exhausted their entire allotted retry attempts (up to 3x) without achieving gateway settlement.",
    },
    PRE_CHECKOUT_DROP: {
      label: "Pre-Checkout Abandonment",
      icon: UserMinus,
      explanation: "Fast-checkout actors abandoned before rail selection due to friction sensitivity or preferred rail absence.",
    },
    AUTH_TIMEOUT: {
      label: "3DS / Auth Latency Timeout",
      icon: Clock,
      explanation: "Authentication challenge latency exceeded the agent's maximum timeout tolerance threshold.",
    },
  };

  const totalLosses = Object.values(dropoffs).reduce((a, b) => a + b, 0);

  const sortedDropoffs = Object.entries(dropoffs).sort((a, b) => b[1] - a[1]);

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-3.5 text-red-600" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Funnel Loss & Drop-Off Attribution
            </h3>
          </div>
          <p className="text-xs text-textSecondary">
            Attribution of unconverted synthetic agents mapped to behavioral state-machine termination points.
          </p>
        </div>
        <span className="text-[10px] font-mono text-red-700 font-semibold tabular-nums">
          {totalLosses.toLocaleString()} Total Dropouts ({totalPopulation > 0 ? ((totalLosses / totalPopulation) * 100).toFixed(1) : 0}%)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sortedDropoffs.map(([stageKey, count]) => {
          const meta = dropoffDescriptions[stageKey] || {
            label: stageKey.replace(/_/g, " "),
            icon: AlertCircle,
            explanation: "Terminal loss point during simulation traversal.",
          };
          const Icon = meta.icon;
          const lossShare = totalLosses > 0 ? ((count / totalLosses) * 100).toFixed(1) : "0.0";
          const popShare = totalPopulation > 0 ? ((count / totalPopulation) * 100).toFixed(1) : "0.0";

          return (
            <div
              key={stageKey}
              className="p-3 rounded-md border border-hairline bg-canvas/40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-textPrimary">
                  <Icon className="size-3.5 text-textSecondary shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{meta.label}</span>
                </div>
                <span className="font-mono text-xs font-bold text-red-700 tabular-nums">
                  {count.toLocaleString()} <span className="text-[10px] font-normal text-textTertiary">({popShare}%)</span>
                </span>
              </div>

              <div className="h-1 w-full rounded-full bg-hairline/60 overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, parseFloat(lossShare)))}%` }}
                />
              </div>

              <p className="text-[10px] text-textSecondary leading-normal">
                {meta.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
