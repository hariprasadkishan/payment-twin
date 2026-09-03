import React from "react";
import { ObjectiveType } from "@/types/optimization";
import { Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizationObjectivesStripProps {
  activeObjectives: ObjectiveType[];
  onToggleObjective?: (obj: ObjectiveType) => void;
}

interface ObjectiveMeta {
  type: ObjectiveType;
  label: string;
  metric: string;
  direction: "MAXIMIZE" | "MINIMIZE";
  description: string;
}

const SUPPORTED_OBJECTIVES: ObjectiveMeta[] = [
  {
    type: "MAX_NET_REVENUE",
    label: "Net Merchant Revenue",
    metric: "net_merchant_revenue_inr",
    direction: "MAXIMIZE",
    description: "Gross captured volume minus interchange and gateway processing fees",
  },
  {
    type: "MAX_CONVERSION_RATE",
    label: "Capture Conversion",
    metric: "conversion_rate_percent",
    direction: "MAXIMIZE",
    description: "Percentage of unique sessions ending in successful settlement",
  },
  {
    type: "MIN_PROCESSING_FEES",
    label: "Gateway Fees",
    metric: "total_processing_fees_inr",
    direction: "MINIMIZE",
    description: "Total interchange MDR and gateway costs paid per transaction",
  },
  {
    type: "MIN_FAILURE_RATE",
    label: "Terminal Failure Rate",
    metric: "failure_rate_percent",
    direction: "MINIMIZE",
    description: "Percentage of unique sessions encountering terminal declines",
  },
];

export const OptimizationObjectivesStrip: React.FC<OptimizationObjectivesStripProps> = ({
  activeObjectives,
  onToggleObjective,
}) => {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3.5 shadow-panel space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline/60 pb-2">
        <div className="flex items-center gap-2">
          <Target className="size-3.5 text-accent" strokeWidth={1.75} />
          <span className="font-semibold text-textPrimary text-xs">
            Competing Optimization Objectives (Pareto Criterion)
          </span>
          <span className="text-[10px] font-mono text-textTertiary">
            ({activeObjectives.length} active criteria)
          </span>
        </div>
        <span className="text-[10px] text-textTertiary font-mono">
          Non-dominated Pareto sorting requires at least 2 competing objectives
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {SUPPORTED_OBJECTIVES.map((obj) => {
          const isActive = activeObjectives.includes(obj.type);
          const isMax = obj.direction === "MAXIMIZE";

          return (
            <div
              key={obj.type}
              onClick={() => onToggleObjective && onToggleObjective(obj.type)}
              className={cn(
                "p-2.5 rounded-md border text-xs transition-all select-none space-y-1",
                isActive
                  ? "border-accent/40 bg-indigo-50/30 cursor-pointer shadow-xs"
                  : "border-hairline bg-canvas/40 opacity-70 hover:opacity-100 cursor-pointer"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-textPrimary text-xs truncate">
                  {obj.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                    isMax
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      : "text-blue-700 bg-blue-50 border border-blue-200"
                  )}
                >
                  {isMax ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                  <span>{obj.direction}</span>
                </span>
              </div>

              <p className="text-[10px] text-textTertiary leading-tight line-clamp-2">
                {obj.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
