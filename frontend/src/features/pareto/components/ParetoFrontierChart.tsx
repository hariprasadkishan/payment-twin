import React, { useState } from "react";
import {
  InfeasibleScenarioItem,
  ParetoScenarioItem,
} from "@/types/optimization";
import { Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParetoFrontierChartProps {
  frontierScenarios: ParetoScenarioItem[];
  dominatedScenarios: ParetoScenarioItem[];
  infeasibleScenarios: InfeasibleScenarioItem[];
  baselineSummary?: Record<string, number>;
  selectedCandidateId?: string | null;
  onSelectCandidate: (candidate: ParetoScenarioItem | InfeasibleScenarioItem) => void;
  xAxisKey: string;
  onXAxisKeyChange: (key: string) => void;
  yAxisKey: string;
  onYAxisKeyChange: (key: string) => void;
}

export const ParetoFrontierChart: React.FC<ParetoFrontierChartProps> = ({
  frontierScenarios,
  dominatedScenarios,
  infeasibleScenarios,
  baselineSummary,
  selectedCandidateId,
  onSelectCandidate,
  xAxisKey,
  onXAxisKeyChange,
  yAxisKey,
  onYAxisKeyChange,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    id: string;
    name: string;
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    type: "frontier" | "dominated" | "infeasible" | "baseline";
    params?: Record<string, number>;
    dominates?: number;
    ci95?: [number, number];
  } | null>(null);

  const axisLabels: Record<string, { label: string; unit: string }> = {
    conversion_rate_percent: { label: "Capture Conversion Rate", unit: "%" },
    net_merchant_revenue_inr: { label: "Net Merchant Revenue", unit: "₹" },
    total_processing_fees_inr: { label: "Gateway Processing Fees", unit: "₹" },
    failure_rate_percent: { label: "Terminal Failure Rate", unit: "%" },
  };

  // Dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 30, right: 35, bottom: 50, left: 80 };

  // Collect all points
  const allPoints: {
    id: string;
    x: number;
    y: number;
    type: "frontier" | "dominated" | "infeasible" | "baseline";
    raw: any;
  }[] = [];

  frontierScenarios.forEach((s) => {
    allPoints.push({
      id: s.scenario_id,
      x: s.objective_values[xAxisKey] ?? 0,
      y: s.objective_values[yAxisKey] ?? 0,
      type: "frontier",
      raw: s,
    });
  });

  dominatedScenarios.forEach((s) => {
    allPoints.push({
      id: s.scenario_id,
      x: s.objective_values[xAxisKey] ?? 0,
      y: s.objective_values[yAxisKey] ?? 0,
      type: "dominated",
      raw: s,
    });
  });

  infeasibleScenarios.forEach((s) => {
    allPoints.push({
      id: s.scenario_id,
      x: s.metric_values[xAxisKey] ?? 0,
      y: s.metric_values[yAxisKey] ?? 0,
      type: "infeasible",
      raw: s,
    });
  });

  let basePoint: { x: number; y: number } | null = null;
  if (baselineSummary && baselineSummary[xAxisKey] !== undefined && baselineSummary[yAxisKey] !== undefined) {
    basePoint = {
      x: baselineSummary[xAxisKey],
      y: baselineSummary[yAxisKey],
    };
    allPoints.push({
      id: "baseline",
      x: basePoint.x,
      y: basePoint.y,
      type: "baseline",
      raw: { scenario_id: "baseline", scenario_name: "Empirical Baseline", objective_values: baselineSummary },
    });
  }

  // Calculate domains
  const xValues = allPoints.map((p) => p.x);
  const yValues = allPoints.map((p) => p.y);

  const minX = Math.min(...(xValues.length ? xValues : [0]));
  const maxX = Math.max(...(xValues.length ? xValues : [100]));
  const minY = Math.min(...(yValues.length ? yValues : [0]));
  const maxY = Math.max(...(yValues.length ? yValues : [100]));

  const xPadding = (maxX - minX) * 0.1 || (minX * 0.05) || 1.0;
  const yPadding = (maxY - minY) * 0.1 || (minY * 0.05) || 1.0;

  const domainX = [minX - xPadding, maxX + xPadding];
  const domainY = [minY - yPadding, maxY + yPadding];

  // Scales
  const scaleX = (val: number) => {
    return margin.left + ((val - domainX[0]) / (domainX[1] - domainX[0])) * (width - margin.left - margin.right);
  };

  const scaleY = (val: number) => {
    return height - margin.bottom - ((val - domainY[0]) / (domainY[1] - domainY[0])) * (height - margin.top - margin.bottom);
  };

  // Sort frontier points for connecting curve
  const sortedFrontier = [...frontierScenarios].sort((a, b) => {
    return (a.objective_values[xAxisKey] ?? 0) - (b.objective_values[xAxisKey] ?? 0);
  });

  const frontierPath = sortedFrontier.length > 1
    ? sortedFrontier
        .map((s, idx) => {
          const sx = scaleX(s.objective_values[xAxisKey] ?? 0);
          const sy = scaleY(s.objective_values[yAxisKey] ?? 0);
          return `${idx === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
        })
        .join(" ")
    : null;

  // Generate 5 grid ticks
  const xTicks = [0, 1, 2, 3, 4].map((i) => domainX[0] + (i / 4) * (domainX[1] - domainX[0]));
  const yTicks = [0, 1, 2, 3, 4].map((i) => domainY[0] + (i / 4) * (domainY[1] - domainY[0]));

  const formatTick = (val: number, key: string) => {
    if (key.includes("rate") || key.includes("percent")) return `${val.toFixed(1)}%`;
    if (key.includes("revenue") || key.includes("fees")) {
      return val >= 1000000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${(val / 1000).toFixed(0)}k`;
    }
    return val.toFixed(1);
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3 relative">
      {/* Chart Top Control Bar: Title & Axis Pickers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Crosshair className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Pareto Efficient Frontier (Multi-Objective Scatter Space)
            </h3>
          </div>
          <p className="text-xs text-textSecondary">
            Non-dominated operating points represent optimal mathematical trade-offs where improving one objective strictly worsens another.
          </p>
        </div>

        {/* Axis Selectors */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-textTertiary font-sans">X-Axis:</span>
            <select
              value={xAxisKey}
              onChange={(e) => onXAxisKeyChange(e.target.value)}
              className="px-2 py-1 rounded border border-hairline bg-canvas text-xs font-mono text-textPrimary focus:outline-none"
            >
              <option value="conversion_rate_percent">Conversion Rate (%)</option>
              <option value="total_processing_fees_inr">Processing Fees (₹)</option>
              <option value="failure_rate_percent">Failure Rate (%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-textTertiary font-sans">Y-Axis:</span>
            <select
              value={yAxisKey}
              onChange={(e) => onYAxisKeyChange(e.target.value)}
              className="px-2 py-1 rounded border border-hairline bg-canvas text-xs font-mono text-textPrimary focus:outline-none"
            >
              <option value="net_merchant_revenue_inr">Net Revenue (₹)</option>
              <option value="conversion_rate_percent">Conversion Rate (%)</option>
              <option value="total_processing_fees_inr">Processing Fees (₹)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart Instrument */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: 600 }}
        >
          {/* Background Grid Lines & Ticks */}
          {xTicks.map((tick, idx) => {
            const x = scaleX(tick);
            return (
              <g key={`xtick-${idx}`}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - margin.bottom + 16}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {formatTick(tick, xAxisKey)}
                </text>
              </g>
            );
          })}

          {yTicks.map((tick, idx) => {
            const y = scaleY(tick);
            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {formatTick(tick, yAxisKey)}
                </text>
              </g>
            );
          })}

          {/* Axes Base Lines */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#cbd5e1"
            strokeWidth="1.25"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#cbd5e1"
            strokeWidth="1.25"
          />

          {/* Explicit Axis Labels */}
          <text
            x={(width + margin.left - margin.right) / 2}
            y={height - 12}
            fill="#0f172a"
            fontSize="11"
            fontFamily="sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            {axisLabels[xAxisKey]?.label || xAxisKey}
          </text>

          <text
            x={-((height + margin.top - margin.bottom) / 2)}
            y={22}
            transform="rotate(-90)"
            fill="#0f172a"
            fontSize="11"
            fontFamily="sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            {axisLabels[yAxisKey]?.label || yAxisKey}
          </text>

          {/* Connected Non-Dominated Frontier Curve */}
          {frontierPath && (
            <path
              d={frontierPath}
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.8"
            />
          )}

          {/* 1. Infeasible Points (Soft Red Dots) */}
          {infeasibleScenarios.map((s) => {
            const x = scaleX(s.metric_values[xAxisKey] ?? 0);
            const y = scaleY(s.metric_values[yAxisKey] ?? 0);
            const isSelected = selectedCandidateId === s.scenario_id;

            return (
              <circle
                key={s.scenario_id}
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill="#fca5a5"
                stroke={isSelected ? "#991b1b" : "#ef4444"}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectCandidate(s)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredPoint({
                    id: s.scenario_id,
                    name: s.scenario_name,
                    x: s.metric_values[xAxisKey] ?? 0,
                    y: s.metric_values[yAxisKey] ?? 0,
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top,
                    type: "infeasible",
                    params: s.parameter_values,
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* 2. Feasible Dominated Points (Slate Dots) */}
          {dominatedScenarios.map((s) => {
            const x = scaleX(s.objective_values[xAxisKey] ?? 0);
            const y = scaleY(s.objective_values[yAxisKey] ?? 0);
            const isSelected = selectedCandidateId === s.scenario_id;

            return (
              <circle
                key={s.scenario_id}
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4.5}
                fill="#94a3b8"
                stroke={isSelected ? "#1e3a8a" : "#cbd5e1"}
                strokeWidth={isSelected ? 2.5 : 1}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectCandidate(s)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredPoint({
                    id: s.scenario_id,
                    name: s.scenario_name,
                    x: s.objective_values[xAxisKey] ?? 0,
                    y: s.objective_values[yAxisKey] ?? 0,
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top,
                    type: "dominated",
                    params: s.parameter_values,
                    dominates: s.dominates_count,
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* 3. Baseline Reference Point (Amber Diamond) */}
          {basePoint && (
            <g
              transform={`translate(${scaleX(basePoint.x)}, ${scaleY(basePoint.y)})`}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredPoint({
                  id: "baseline",
                  name: "Empirical Baseline Reference Point",
                  x: basePoint!.x,
                  y: basePoint!.y,
                  screenX: rect.left + rect.width / 2,
                  screenY: rect.top,
                  type: "baseline",
                });
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <rect
                x="-6"
                y="-6"
                width="12"
                height="12"
                transform="rotate(45)"
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <text
                x="10"
                y="3"
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight="bold"
                fill="#b45309"
              >
                Baseline
              </text>
            </g>
          )}

          {/* 4. Non-Dominated Pareto Frontier Points (Indigo Circles) */}
          {frontierScenarios.map((s) => {
            const x = scaleX(s.objective_values[xAxisKey] ?? 0);
            const y = scaleY(s.objective_values[yAxisKey] ?? 0);
            const isSelected = selectedCandidateId === s.scenario_id;

            return (
              <g key={s.scenario_id} className="cursor-pointer">
                {/* Double ring if selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 6}
                  fill="#1e3a8a"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform hover:scale-125"
                  onClick={() => onSelectCandidate(s)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ci = s.uncertainty_bounds?.[xAxisKey]?.ci_95 as [number, number] | undefined;
                    setHoveredPoint({
                      id: s.scenario_id,
                      name: s.scenario_name,
                      x: s.objective_values[xAxisKey] ?? 0,
                      y: s.objective_values[yAxisKey] ?? 0,
                      screenX: rect.left + rect.width / 2,
                      screenY: rect.top,
                      type: "frontier",
                      params: s.parameter_values,
                      dominates: s.dominates_count,
                      ci95: ci,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-hairline/60">
        <div className="flex items-center gap-4 text-[11px] font-mono text-textSecondary">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent border border-white" />
            <span>Pareto-Optimal ({frontierScenarios.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-400" />
            <span>Dominated ({dominatedScenarios.length})</span>
          </div>

          {basePoint && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rotate-45 bg-amber-500" />
              <span>Empirical Baseline</span>
            </div>
          )}

          {infeasibleScenarios.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-400" />
              <span>Infeasible ({infeasibleScenarios.length})</span>
            </div>
          )}
        </div>

        <span className="text-[10px] text-textTertiary font-mono">
          Click any point to inspect detailed policy overrides
        </span>
      </div>

      {/* Rich Interactive Point Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 p-3 rounded-lg border border-hairline bg-surface shadow-xl space-y-1.5 pointer-events-none text-xs font-mono max-w-xs animate-in fade-in-50"
          style={{
            left: Math.min(hoveredPoint.screenX + 12, window.innerWidth - 300),
            top: Math.max(hoveredPoint.screenY - 80, 20),
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-hairline pb-1">
            <span className="font-bold text-textPrimary text-xs truncate">
              {hoveredPoint.type === "baseline" ? "Baseline Reference" : hoveredPoint.name}
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                hoveredPoint.type === "frontier"
                  ? "bg-indigo-50 text-accent border border-indigo-200"
                  : hoveredPoint.type === "baseline"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-canvas text-textSecondary border border-hairline"
              )}
            >
              {hoveredPoint.type}
            </span>
          </div>

          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-textTertiary">{axisLabels[xAxisKey]?.label}:</span>
              <span className="font-bold text-textPrimary tabular-nums">
                {formatTick(hoveredPoint.x, xAxisKey)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-textTertiary">{axisLabels[yAxisKey]?.label}:</span>
              <span className="font-bold text-textPrimary tabular-nums">
                {formatTick(hoveredPoint.y, yAxisKey)}
              </span>
            </div>
          </div>

          {hoveredPoint.params && (
            <div className="pt-1 border-t border-hairline/60 space-y-0.5 text-[10px] text-textSecondary">
              <span className="text-textTertiary font-sans uppercase font-medium text-[9px] block">
                Parameters:
              </span>
              {Object.entries(hoveredPoint.params).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="truncate">{k}:</span>
                  <span className="font-bold text-textPrimary tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          )}

          {hoveredPoint.dominates !== undefined && (
            <div className="text-[10px] text-accent pt-1">
              Dominates {hoveredPoint.dominates} other candidates
            </div>
          )}
        </div>
      )}
    </div>
  );
};
