import React from "react";
import { cn } from "@/lib/utils";

export interface MethodShareItem {
  key: string;
  label: string;
  percentage: number;
  color: string;
}

export interface DistributionBarProps {
  items: MethodShareItem[];
  className?: string;
}

export const DistributionBar: React.FC<DistributionBarProps> = ({ items, className }) => {
  if (!items || items.length === 0) {
    return (
      <div className="w-full h-3 rounded-full bg-twin-card border border-twin-border animate-pulse" />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Stacked Bar */}
      <div className="w-full h-2.5 rounded-full bg-twin-card border border-twin-border overflow-hidden flex">
        {items.map((item) => (
          <div
            key={item.key}
            style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%`, backgroundColor: item.color }}
            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            title={`${item.label}: ${item.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-twin-slate">{item.label}</span>
            <span className="font-semibold text-twin-white">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
