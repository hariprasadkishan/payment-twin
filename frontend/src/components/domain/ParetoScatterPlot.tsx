import React, { useState } from "react";
import {
  InfeasibleScenarioItem,
  ParetoScenarioItem,
} from "@/types/optimization";
import { cn } from "@/lib/utils";

export interface ParetoScatterPlotProps {
  frontierScenarios: ParetoScenarioItem[];
  dominatedScenarios: ParetoScenarioItem[];
  infeasibleScenarios: InfeasibleScenarioItem[];
  baselineSummary?: Record<string, number>;
  xAxisMetric: string;
  yAxisMetric: string;
  xAxisLabel: string;
  yAxisLabel: string;
  selectedCandidateId?: string | null;
  comparisonCandidateId?: string | null;
  onSelectCandidate?: (candidate: ParetoScenarioItem | InfeasibleScenarioItem) => void;
  className?: string;
  height?: number;
}

export const ParetoScatterPlot: React.FC<ParetoScatterPlotProps> = ({
  frontierScenarios,
  dominatedScenarios,
  infeasibleScenarios,
  baselineSummary,
  xAxisMetric,
  yAxisMetric,
  xAxisLabel,
  yAxisLabel,
  selectedCandidateId,
  comparisonCandidateId,
  onSelectCandidate,
  className = "",
  height = 420,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    id: string;
    name: string;
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    type: "frontier" | "dominated" | "infeasible" | "baseline";
    details?: string;
  } | null>(null);

  const margin = { top: 30, right: 30, bottom: 50, left: 75 };
  const width = 760; // SVG viewBox width

  // Extract all points to calculate bounds
  const allPoints: { id: string; x: number; y: number; type: "frontier" | "dominated" | "infeasible" | "baseline"; raw: any }[] = [];

  frontierScenarios.forEach((s) => {
    allPoints.push({
      id: s.scenario_id,
      x: s.objective_values[xAxisMetric] ?? 0,
      y: s.objective_values[yAxisMetric] ?? 0,
      type: "frontier",
      raw: s,
    });
  });

  dominatedScenarios.forEach((s) => {
    allPoints.push({
      id: s.scenario_id,
      x: s.objective_values[xAxisMetric] ?? 0,
      y: s.objective_values[yAxisMetric] ?? 0,
      type: "dominated",
      raw: s,
    });
  });

  infeasibleScenarios.forEach((s) => {
    allPoints.push({
      id: s.scenario_id,
      x: s.metric_values[xAxisMetric] ?? 0,
      y: s.metric_values[yAxisMetric] ?? 0,
      type: "infeasible",
      raw: s,
    });
  });

  let baselineX = 0;
  let baselineY = 0;
  if (baselineSummary) {
    baselineX = baselineSummary[xAxisMetric] ?? 0;
    baselineY = baselineSummary[yAxisMetric] ?? 0;
    allPoints.push({
      id: "baseline",
      x: baselineX,
      y: baselineY,
      type: "baseline",
      raw: { scenario_id: "baseline", scenario_name: "Observed Baseline", objective_values: baselineSummary },
    });
  }

  if (allPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-twin-border rounded-xl bg-twin-card/30 text-xs font-mono text-twin-slate">
        No candidate data to display on scatter plot.
      </div>
    );
  }

  // Calculate Min / Max
  const xValues = allPoints.map((p) => p.x);
  const yValues = allPoints.map((p) => p.y);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const xPadding = (maxX - minX) * 0.1 || (minX * 0.05) || 1.0;
  const yPadding = (maxY - minY) * 0.1 || (minY * 0.05) || 1.0;

  const domainX = [minX - xPadding, maxX + xPadding];
  const domainY = [minY - yPadding, maxY + yPadding];

  // Scale functions
  const scaleX = (val: number) => {
    return margin.left + ((val - domainX[0]) / (domainX[1] - domainX[0])) * (width - margin.left - margin.right);
  };

  const scaleY = (val: number) => {
    return height - margin.bottom - ((val - domainY[0]) / (domainY[1] - domainY[0])) * (height - margin.top - margin.bottom);
  };

  // Sort frontier points for connecting curve
  const sortedFrontier = [...frontierScenarios].sort((a, b) => {
    return (a.objective_values[xAxisMetric] ?? 0) - (b.objective_values[xAxisMetric] ?? 0);
  });

  const frontierPath = sortedFrontier
    .map((s, idx) => {
      const sx = scaleX(s.objective_values[xAxisMetric] ?? 0);
      const sy = scaleY(s.objective_values[yAxisMetric] ?? 0);
      return `${idx === 0 ? "M" : "L"} ${sx} ${sy}`;
    })
    .join(" ");

  // Grid tick marks
  const xTicks = 5;
  const yTicks = 5;
  const xTickValues = Array.from({ length: xTicks }, (_, i) => domainX[0] + (i * (domainX[1] - domainX[0])) / (xTicks - 1));
  const yTickValues = Array.from({ length: yTicks }, (_, i) => domainY[0] + (i * (domainY[1] - domainY[0])) / (yTicks - 1));

  return (
    <div className={cn("relative w-full rounded-xl border border-twin-border bg-[#080B12] p-4 shadow-2xl", className)}>
      {/* Legend Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pb-2 border-b border-twin-border/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-twin-cyan shadow-sm shadow-twin-cyan/50" />
            <span className="text-twin-white font-semibold">Pareto Optimal ({frontierScenarios.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-twin-slate/70" />
            <span className="text-twin-slate">Dominated ({dominatedScenarios.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-twin-danger/50" />
            <span className="text-twin-slate">Infeasible ({infeasibleScenarios.length})</span>
          </div>

          {baselineSummary && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rotate-45 bg-twin-warning border border-white" />
              <span className="text-twin-warning font-semibold">Current Baseline</span>
            </div>
          )}
        </div>

        <span className="text-[10px] text-twin-slate">NON-DOMINATED TRADE-OFF FRONTIER</span>
      </div>

      {/* Main SVG Scatter Canvas */}
      <div className="relative overflow-hidden w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Background Grid Lines */}
          {xTickValues.map((t, idx) => {
            const x = scaleX(t);
            return (
              <g key={`x-grid-${idx}`}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="rgba(28, 37, 56, 0.4)"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={height - margin.bottom + 18}
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  textAnchor="middle"
                >
                  {t.toFixed(t > 100 ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {yTickValues.map((t, idx) => {
            const y = scaleY(t);
            return (
              <g key={`y-grid-${idx}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="rgba(28, 37, 56, 0.4)"
                  strokeDasharray="2,2"
                />
                <text
                  x={margin.left - 10}
                  y={y + 3}
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  textAnchor="end"
                >
                  {t > 1000 ? `₹${(t / 1000).toFixed(0)}k` : t.toFixed(t > 10 ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {/* Axes Lines */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#1C2538"
            strokeWidth="1.5"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#1C2538"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text
            x={(width + margin.left - margin.right) / 2}
            y={height - 10}
            fill="#F8FAFC"
            fontSize="11"
            fontFamily="'Outfit', sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            {xAxisLabel}
          </text>

          <text
            x={-((height + margin.top - margin.bottom) / 2)}
            y={20}
            transform="rotate(-90)"
            fill="#F8FAFC"
            fontSize="11"
            fontFamily="'Outfit', sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            {yAxisLabel}
          </text>

          {/* Connected Pareto Frontier Curve */}
          {frontierPath && (
            <path
              d={frontierPath}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2"
              strokeDasharray="4,4"
              className="animate-pulse opacity-80"
            />
          )}

          {/* 1. Infeasible Points */}
          {infeasibleScenarios.map((s) => {
            const x = scaleX(s.metric_values[xAxisMetric] ?? 0);
            const y = scaleY(s.metric_values[yAxisMetric] ?? 0);
            const isSelected = selectedCandidateId === s.scenario_id;

            return (
              <circle
                key={s.scenario_id}
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill="#EF4444"
                fillOpacity={0.4}
                stroke={isSelected ? "#F8FAFC" : "#EF4444"}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer transition-all hover:scale-125"
                onClick={() => onSelectCandidate && onSelectCandidate(s)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredPoint({
                    id: s.scenario_id,
                    name: s.scenario_name,
                    x: s.metric_values[xAxisMetric] ?? 0,
                    y: s.metric_values[yAxisMetric] ?? 0,
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top,
                    type: "infeasible",
                    details: s.violated_constraints.join("; "),
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* 2. Feasible Dominated Points */}
          {dominatedScenarios.map((s) => {
            const x = scaleX(s.objective_values[xAxisMetric] ?? 0);
            const y = scaleY(s.objective_values[yAxisMetric] ?? 0);
            const isSelected = selectedCandidateId === s.scenario_id || comparisonCandidateId === s.scenario_id;

            return (
              <circle
                key={s.scenario_id}
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4.5}
                fill="#64748B"
                fillOpacity={0.6}
                stroke={isSelected ? "#06B6D4" : "#1C2538"}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer transition-all hover:scale-125"
                onClick={() => onSelectCandidate && onSelectCandidate(s)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredPoint({
                    id: s.scenario_id,
                    name: s.scenario_name,
                    x: s.objective_values[xAxisMetric] ?? 0,
                    y: s.objective_values[yAxisMetric] ?? 0,
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top,
                    type: "dominated",
                    details: `Dominated by ${s.dominated_by.length} scenario(s)`,
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* 3. Non-Dominated Pareto Optimal Points */}
          {frontierScenarios.map((s) => {
            const x = scaleX(s.objective_values[xAxisMetric] ?? 0);
            const y = scaleY(s.objective_values[yAxisMetric] ?? 0);
            const isSelected = selectedCandidateId === s.scenario_id;
            const isComparing = comparisonCandidateId === s.scenario_id;

            return (
              <g key={s.scenario_id} className="cursor-pointer">
                {/* Glow ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected || isComparing ? 12 : 8}
                  fill="#06B6D4"
                  fillOpacity={0.2}
                  className="animate-ping"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected || isComparing ? 7 : 5.5}
                  fill={isComparing ? "#6366F1" : "#06B6D4"}
                  stroke="#080B11"
                  strokeWidth={2}
                  className="transition-all hover:scale-125"
                  onClick={() => onSelectCandidate && onSelectCandidate(s)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredPoint({
                      id: s.scenario_id,
                      name: s.scenario_name,
                      x: s.objective_values[xAxisMetric] ?? 0,
                      y: s.objective_values[yAxisMetric] ?? 0,
                      screenX: rect.left + rect.width / 2,
                      screenY: rect.top,
                      type: "frontier",
                      details: s.tradeoff_notes || "Non-dominated Pareto-optimal configuration",
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* 4. Baseline Marker */}
          {baselineSummary && (
            <g className="cursor-pointer">
              <polygon
                points={`
                  ${scaleX(baselineX)},${scaleY(baselineY) - 7}
                  ${scaleX(baselineX) + 7},${scaleY(baselineY)}
                  ${scaleX(baselineX)},${scaleY(baselineY) + 7}
                  ${scaleX(baselineX) - 7},${scaleY(baselineY)}
                `}
                fill="#F59E0B"
                stroke="#F8FAFC"
                strokeWidth="1.5"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredPoint({
                    id: "baseline",
                    name: "Current Baseline",
                    x: baselineX,
                    y: baselineY,
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top,
                    type: "baseline",
                    details: "Merchant empirical baseline reference point",
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Hover Floating Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-50 pointer-events-none p-3 rounded-lg glass-panel border border-twin-border text-xs font-mono shadow-2xl space-y-1"
          style={{
            left: "50%",
            top: "15px",
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                hoveredPoint.type === "frontier"
                  ? "bg-twin-cyan"
                  : hoveredPoint.type === "baseline"
                  ? "bg-twin-warning"
                  : hoveredPoint.type === "dominated"
                  ? "bg-twin-slate"
                  : "bg-twin-danger"
              )}
            />
            <span className="font-bold text-twin-white">{hoveredPoint.name}</span>
          </div>
          <div className="text-[11px] text-twin-slate">
            <span>{xAxisLabel}: <strong>{hoveredPoint.x.toLocaleString()}</strong></span> |{" "}
            <span>{yAxisLabel}: <strong>{hoveredPoint.y.toLocaleString()}</strong></span>
          </div>
          {hoveredPoint.details && (
            <div className="text-[10px] text-twin-slate/80 border-t border-twin-border/40 pt-1">
              {hoveredPoint.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
