import React, { useState } from "react";
import { ArrowRight, CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import { DatasetSummaryResponse } from "@/types/dataset";
import { cn } from "@/lib/utils";

interface MethodItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ElementType;
}

interface OverviewPerformanceChartProps {
  summary?: DatasetSummaryResponse | null;
  totalRecords: number;
  onExploreDNA: () => void;
}

const formatNumber = (val?: number | null) =>
  val == null ? "—" : new Intl.NumberFormat("en-IN").format(val);

const formatCurrency = (val?: number | null) =>
  val == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(val);

export const OverviewPerformanceChart: React.FC<OverviewPerformanceChartProps> = ({
  summary,
  totalRecords,
  onExploreDNA,
}) => {
  const [viewMode, setViewMode] = useState<"attempts" | "volume">("attempts");
  const [hoveredRail, setHoveredRail] = useState<string | null>(null);

  const totalAmount = summary?.financial_metrics?.total_amount_inr ?? 0;

  // Prepare normalized rail items
  const railData: MethodItem[] = React.useMemo(() => {
    if (!summary?.method_distribution || totalRecords === 0) return [];

    const iconMap: Record<string, React.ElementType> = {
      upi: Smartphone,
      card: CreditCard,
      netbanking: Building2,
      wallet: Wallet,
    };

    const colorMap: Record<string, string> = {
      upi: "#1e3a8a", // Deep navy / primary
      card: "#2563eb", // Electric blue
      netbanking: "#475569", // Slate
      wallet: "#94a3b8", // Light slate
    };

    const order = ["upi", "card", "netbanking", "wallet"];

    return order
      .filter((key) => summary.method_distribution[key] !== undefined)
      .map((key) => {
        const count = summary.method_distribution[key] || 0;
        const percentage = totalRecords > 0 ? (count / totalRecords) * 100 : 0;
        return {
          key,
          label: key.toUpperCase(),
          count,
          percentage,
          color: colorMap[key] || "#475569",
          icon: iconMap[key] || CreditCard,
        };
      });
  }, [summary, totalRecords]);

  // Dimensions for the dominant Ledgerix-style analytical surface
  const width = 760;
  const height = 240;
  const margin = { top: 25, right: 30, bottom: 45, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const maxVal = Math.max(...railData.map((r) => r.percentage), 70);

  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-panel space-y-4">
      {/* Surface Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline px-6 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-textPrimary">
              Payment Rail Mix & Volume Distribution
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-subtle text-textSecondary font-medium">
              30-Day Baseline
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Observed transaction distribution and checkout method trajectory across rails.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-hairline bg-canvas p-0.5 text-[11px] font-medium text-textSecondary">
            <button
              onClick={() => setViewMode("attempts")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors",
                viewMode === "attempts"
                  ? "bg-surface text-textPrimary shadow-xs font-semibold"
                  : "hover:text-textPrimary"
              )}
            >
              Attempts Share
            </button>
            <button
              onClick={() => setViewMode("volume")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors",
                viewMode === "volume"
                  ? "bg-surface text-textPrimary shadow-xs font-semibold"
                  : "hover:text-textPrimary"
              )}
            >
              Est. Volume
            </button>
          </div>

          <button
            onClick={onExploreDNA}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/90 transition-colors"
          >
            <span>Explore Behavioral DNA</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Dominant Chart Surface (Ledgerix style: hairline grid, vertical bar texture, smooth curve) */}
      <div className="px-6">
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none block"
            style={{ minWidth: 540 }}
          >
            {/* Horizontal Hairline Guide Rules */}
            {[0, 25, 50, 75].map((tick) => {
              const y = margin.top + plotHeight - (tick / maxVal) * plotHeight;
              return (
                <g key={`guide-${tick}`}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + plotWidth}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={margin.left - 10}
                    y={y + 3.5}
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="ui-monospace, monospace"
                    textAnchor="end"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Rail Histogram Columns with Signature Ledgerix Vertical Bar Texture */}
            {railData.map((rail, idx) => {
              const colWidth = plotWidth / railData.length;
              const colCenter = margin.left + idx * colWidth + colWidth / 2;
              const barHeight = (rail.percentage / maxVal) * plotHeight;
              const barTop = margin.top + plotHeight - barHeight;
              const isHovered = hoveredRail === rail.key;

              // 7 fine vertical lines per column creating the signature Ledgerix financial texture
              const subBarCount = 9;
              const subBarGap = 4;
              const clusterWidth = subBarCount * subBarGap;
              const startX = colCenter - clusterWidth / 2;

              return (
                <g
                  key={rail.key}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredRail(rail.key)}
                  onMouseLeave={() => setHoveredRail(null)}
                >
                  {/* Broad transparent hit area */}
                  <rect
                    x={colCenter - colWidth / 2}
                    y={margin.top}
                    width={colWidth}
                    height={plotHeight}
                    fill="transparent"
                  />

                  {/* Vertical bar cluster */}
                  {Array.from({ length: subBarCount }).map((_, bIdx) => {
                    const bx = startX + bIdx * subBarGap;
                    // Slightly dome the heights toward the center for an organic statistical feel
                    const heightFactor = 1 - Math.abs(bIdx - 4) * 0.06;
                    const subHeight = barHeight * heightFactor;
                    const subTop = margin.top + plotHeight - subHeight;

                    return (
                      <line
                        key={`sub-${bIdx}`}
                        x1={bx}
                        y1={margin.top + plotHeight}
                        x2={bx}
                        y2={subTop}
                        stroke={rail.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity={isHovered ? 1 : hoveredRail ? 0.35 : 0.75}
                        className="transition-all duration-150"
                      />
                    );
                  })}

                  {/* Center Node on the trajectory */}
                  <circle
                    cx={colCenter}
                    cy={barTop}
                    r={isHovered ? 5 : 3.5}
                    fill="#ffffff"
                    stroke={rail.color}
                    strokeWidth={isHovered ? 2.5 : 1.75}
                    className="transition-all duration-150"
                  />

                  {/* X-Axis Rail Label & Share */}
                  <text
                    x={colCenter}
                    y={margin.top + plotHeight + 18}
                    fill="#0f172a"
                    fontSize="11"
                    fontFamily="sans-serif"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {rail.label}
                  </text>
                  <text
                    x={colCenter}
                    y={margin.top + plotHeight + 32}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    textAnchor="middle"
                  >
                    {rail.percentage.toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {/* Connecting trajectory line across column centers */}
            <path
              d={railData
                .map((rail, idx) => {
                  const colWidth = plotWidth / railData.length;
                  const colCenter = margin.left + idx * colWidth + colWidth / 2;
                  const barHeight = (rail.percentage / maxVal) * plotHeight;
                  const barTop = margin.top + plotHeight - barHeight;
                  return `${idx === 0 ? "M" : "L"} ${colCenter} ${barTop}`;
                })
                .join(" ")}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.25"
              strokeDasharray="3,3"
              className="pointer-events-none"
            />
          </svg>

          {/* Ledgerix-style Floating Callout Popover on Hover */}
          {hoveredRail && (() => {
            const rail = railData.find((r) => r.key === hoveredRail);
            if (!rail) return null;
            const idx = railData.findIndex((r) => r.key === hoveredRail);
            const colWidth = plotWidth / railData.length;
            const colCenter = margin.left + idx * colWidth + colWidth / 2;
            const barHeight = (rail.percentage / maxVal) * plotHeight;
            const barTop = margin.top + plotHeight - barHeight;

            const leftPct = (colCenter / width) * 100;
            const topPct = (barTop / height) * 100;
            const estVol = totalAmount * (rail.percentage / 100);

            return (
              <div
                className="absolute z-20 pointer-events-none select-none transition-all duration-150"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: "translate(-50%, calc(-100% - 12px))",
                }}
              >
                <div className="rounded-md border border-hairline bg-surface p-2.5 shadow-dropdown text-xs min-w-[190px] space-y-1">
                  <div className="flex items-center justify-between gap-2 border-b border-hairline pb-1">
                    <span className="font-bold text-textPrimary text-xs">
                      {rail.label}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-50 text-accent font-mono text-[9px] font-semibold">
                      {rail.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-textSecondary">Attempts:</span>
                    <span className="font-mono font-semibold text-textPrimary tabular-nums">
                      {formatNumber(rail.count)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-textSecondary">Est. Volume:</span>
                    <span className="font-mono font-semibold text-textPrimary tabular-nums">
                      {formatCurrency(estVol)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Analytical Table Decomposition below the Chart (Ledgerix / Mercury style) */}
      <div className="border-t border-hairline px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline/70 text-[10px] font-mono uppercase tracking-wider text-textTertiary">
                <th className="pb-2.5 font-medium">Payment Rail</th>
                <th className="pb-2.5 text-right font-medium">Attempts</th>
                <th className="pb-2.5 text-right font-medium">Attempt Share</th>
                <th className="pb-2.5 text-right font-medium">Est. Captured Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/60">
              {railData.map((rail) => {
                const Icon = rail.icon;
                const estVol = totalAmount * (rail.percentage / 100);

                return (
                  <tr
                    key={rail.key}
                    onMouseEnter={() => setHoveredRail(rail.key)}
                    onMouseLeave={() => setHoveredRail(null)}
                    className={cn(
                      "transition-colors group cursor-pointer",
                      hoveredRail === rail.key ? "bg-subtle/50" : "hover:bg-subtle/30"
                    )}
                  >
                    <td className="py-2.5 font-semibold text-textPrimary flex items-center gap-2">
                      <span
                        className="size-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: rail.color }}
                      />
                      <Icon className="size-3.5 text-textSecondary shrink-0" />
                      <span>{rail.label}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-textPrimary tabular-nums">
                      {formatNumber(rail.count)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-textSecondary tabular-nums">
                      {rail.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-textPrimary tabular-nums">
                      {formatCurrency(estVol)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
