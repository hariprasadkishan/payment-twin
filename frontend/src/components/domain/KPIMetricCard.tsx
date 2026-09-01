import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { Info } from "lucide-react";

export interface KPIMetricCardProps {
  title: string;
  value?: number | string | null;
  unit?: string;
  decimals?: number;
  baselineValue?: number | string | null;
  deltaPercent?: number | null;
  deltaInr?: number | null;
  tooltipText?: string;
  isUnavailable?: boolean;
  statusVariant?: "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export const KPIMetricCard: React.FC<KPIMetricCardProps> = ({
  title,
  value,
  unit = "",
  decimals = 1,
  baselineValue,
  deltaPercent,
  tooltipText,
  isUnavailable = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-5 rounded-xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4 border border-twin-border",
        className
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-twin-slate">{title}</span>
          {tooltipText && (
            <Tooltip content={tooltipText}>
              <Info className="w-3.5 h-3.5 text-twin-slate/70 cursor-help" />
            </Tooltip>
          )}
        </div>
        {deltaPercent !== undefined && deltaPercent !== null && !isUnavailable && (
          <Badge
            variant={deltaPercent >= 0 ? "success" : "danger"}
            size="sm"
          >
            {deltaPercent >= 0 ? "+" : ""}
            {deltaPercent.toFixed(1)}%
          </Badge>
        )}
      </div>

      {/* Main Metric Value */}
      <div>
        {isUnavailable || value === undefined || value === null ? (
          <div className="text-xl font-mono text-twin-slate/60 tracking-tight font-medium">
            Unavailable
          </div>
        ) : typeof value === "number" ? (
          <div className="text-2xl font-display font-bold text-twin-white tracking-tight flex items-baseline gap-1">
            <AnimatedNumber value={value} decimals={decimals} />
            <span className="text-sm font-sans font-medium text-twin-slate">{unit}</span>
          </div>
        ) : (
          <div className="text-2xl font-display font-bold text-twin-white tracking-tight">
            {value} <span className="text-sm font-sans font-medium text-twin-slate">{unit}</span>
          </div>
        )}
      </div>

      {/* Footer Comparison */}
      <div className="pt-2 border-t border-twin-border/40 flex items-center justify-between text-[11px] font-mono text-twin-slate">
        <span>Baseline</span>
        <span>
          {isUnavailable || baselineValue === undefined || baselineValue === null
            ? "—"
            : typeof baselineValue === "number"
            ? `${baselineValue.toFixed(decimals)}${unit}`
            : `${baselineValue}${unit}`}
        </span>
      </div>
    </div>
  );
};
