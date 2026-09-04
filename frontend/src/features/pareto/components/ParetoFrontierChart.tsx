import React, { useState, useMemo } from "react";
import {
  InfeasibleScenarioItem,
  ParetoScenarioItem,
} from "@/types/optimization";
import { TrendingUp, Sliders } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
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

// Format parameter configuration into clean concise string
const formatPolicySummary = (params?: Record<string, number>) => {
  if (!params) return "Standard policy";
  const parts: string[] = [];

  if (params.card_mdr !== undefined) {
    parts.push(`${params.card_mdr.toFixed(2)}% MDR`);
  } else if (params.card_mdr_percent !== undefined) {
    parts.push(`${params.card_mdr_percent.toFixed(2)}% MDR`);
  }

  if (params.max_retries !== undefined) {
    const r = Math.round(params.max_retries);
    parts.push(r === 1 ? "1 retry" : `${r} retries`);
  }

  if (params.upi_success !== undefined) {
    parts.push(`${(params.upi_success * 100).toFixed(0)}% UPI`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Standard policy";
};

// Calculate stable tooltip positioning based on chart coordinates to prevent clipping
const getTooltipPlacement = (svgX: number, svgY: number) => {
  // Near top edge: place below the candidate point
  if (svgY < 170) {
    if (svgX > 600) {
      return { transform: "translate(-85%, 14px)" };
    }
    if (svgX < 240) {
      return { transform: "translate(-15%, 14px)" };
    }
    return { transform: "translate(-50%, 14px)" };
  }

  // Near bottom edge: place above the candidate point
  if (svgY > 280) {
    if (svgX > 600) {
      return { transform: "translate(-85%, calc(-100% - 14px))" };
    }
    if (svgX < 240) {
      return { transform: "translate(-15%, calc(-100% - 14px))" };
    }
    return { transform: "translate(-50%, calc(-100% - 14px))" };
  }

  // Vertically middle:
  // Right half: place to the left of the point
  if (svgX >= 446) {
    return { transform: "translate(calc(-100% - 14px), -50%)" };
  }

  // Left half: place to the right of the point
  return { transform: "translate(14px, -50%)" };
};

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
    type: "frontier" | "dominated" | "infeasible" | "baseline";
    params?: Record<string, number>;
    dominates?: number;
  } | null>(null);

  const axisLabels: Record<string, { label: string; unit: string; isCurrency?: boolean; isPercent?: boolean }> = {
    conversion_rate_percent: { label: "Capture Conversion Rate", unit: "%", isPercent: true },
    net_merchant_revenue_inr: { label: "Net Merchant Revenue", unit: "₹", isCurrency: true },
    total_processing_fees_inr: { label: "Gateway Processing Fees", unit: "₹", isCurrency: true },
    failure_rate_percent: { label: "Terminal Failure Rate", unit: "%", isPercent: true },
  };

  // Dimensions
  const width = 840;
  const height = 440;
  const margin = { top: 40, right: 40, bottom: 56, left: 92 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Format tick values concisely
  const formatTick = (val: number, key: string) => {
    if (key.includes("rate") || key.includes("percent")) {
      return `${val.toFixed(1)}%`;
    }
    if (key.includes("revenue") || key.includes("fees")) {
      if (val >= 1000000) {
        return `₹${(val / 100000).toFixed(2)}L`;
      }
      if (val >= 1000) {
        return `₹${(val / 1000).toFixed(1)}k`;
      }
      return `₹${val.toFixed(0)}`;
    }
    return val.toFixed(1);
  };

  // Format precise metric values for tooltips/callouts
  const formatPreciseMetric = (val: number, key: string) => {
    if (key.includes("rate") || key.includes("percent")) {
      return `${val.toFixed(1)}%`;
    }
    if (key.includes("revenue") || key.includes("fees")) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return val.toFixed(1);
  };

  // Build point collection
  const { allPoints, basePoint, sortedFrontier, selectedPoint } = useMemo(() => {
    const points: Array<{
      id: string;
      x: number;
      y: number;
      type: "frontier" | "dominated" | "infeasible" | "baseline";
      raw: ParetoScenarioItem | InfeasibleScenarioItem | { scenario_id: string; scenario_name: string; objective_values: Record<string, number>; parameter_values?: Record<string, number> };
    }> = [];

    frontierScenarios.forEach((s) => {
      points.push({
        id: s.scenario_id,
        x: s.objective_values[xAxisKey] ?? 0,
        y: s.objective_values[yAxisKey] ?? 0,
        type: "frontier",
        raw: s,
      });
    });

    dominatedScenarios.forEach((s) => {
      points.push({
        id: s.scenario_id,
        x: s.objective_values[xAxisKey] ?? 0,
        y: s.objective_values[yAxisKey] ?? 0,
        type: "dominated",
        raw: s,
      });
    });

    infeasibleScenarios.forEach((s) => {
      points.push({
        id: s.scenario_id,
        x: s.metric_values[xAxisKey] ?? 0,
        y: s.metric_values[yAxisKey] ?? 0,
        type: "infeasible",
        raw: s,
      });
    });

    let bp: { x: number; y: number } | null = null;
    if (
      baselineSummary &&
      baselineSummary[xAxisKey] !== undefined &&
      baselineSummary[yAxisKey] !== undefined
    ) {
      bp = {
        x: baselineSummary[xAxisKey],
        y: baselineSummary[yAxisKey],
      };
      points.push({
        id: "baseline",
        x: bp.x,
        y: bp.y,
        type: "baseline",
        raw: {
          scenario_id: "baseline",
          scenario_name: "Empirical Baseline",
          objective_values: baselineSummary,
        },
      });
    }

    // Sort frontier by X-axis ascending for smooth connected line
    const sorted = [...frontierScenarios].sort(
      (a, b) => (a.objective_values[xAxisKey] ?? 0) - (b.objective_values[xAxisKey] ?? 0)
    );

    // Selected point lookup
    const sel = points.find((p) => p.id === selectedCandidateId) ?? null;

    return { allPoints: points, basePoint: bp, sortedFrontier: sorted, selectedPoint: sel };
  }, [frontierScenarios, dominatedScenarios, infeasibleScenarios, baselineSummary, xAxisKey, yAxisKey, selectedCandidateId]);

  // If no points at all, render clean empty state
  if (allPoints.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-6 shadow-panel">
        <EmptyState
          icon={Sliders}
          title="No Optimization Landscape Available"
          description="Execute the Pareto optimizer above to evaluate candidate configurations and plot the empirical decision frontier."
        />
      </div>
    );
  }

  // Calculate domains with balanced financial padding
  const xVals = allPoints.map((p) => p.x);
  const yVals = allPoints.map((p) => p.y);

  const rawMinX = Math.min(...xVals);
  const rawMaxX = Math.max(...xVals);
  const rawMinY = Math.min(...yVals);
  const rawMaxY = Math.max(...yVals);

  const xSpan = rawMaxX - rawMinX || (rawMinX * 0.05) || 1.0;
  const ySpan = rawMaxY - rawMinY || (rawMinY * 0.05) || 1.0;

  // 12% domain padding prevents visual clipping and leaves breathing room
  const domainX: [number, number] = [rawMinX - xSpan * 0.12, rawMaxX + xSpan * 0.14];
  const domainY: [number, number] = [rawMinY - ySpan * 0.12, rawMaxY + ySpan * 0.14];

  // Precise scale transforms
  const scaleX = (val: number) => {
    if (domainX[1] === domainX[0]) return margin.left + plotWidth / 2;
    return margin.left + ((val - domainX[0]) / (domainX[1] - domainX[0])) * plotWidth;
  };

  const scaleY = (val: number) => {
    if (domainY[1] === domainY[0]) return margin.top + plotHeight / 2;
    return margin.top + plotHeight - ((val - domainY[0]) / (domainY[1] - domainY[0])) * plotHeight;
  };

  // 5 Evenly-spaced grid ticks
  const xTicks = [0, 1, 2, 3, 4].map((i) => domainX[0] + (i / 4) * (domainX[1] - domainX[0]));
  const yTicks = [0, 1, 2, 3, 4].map((i) => domainY[0] + (i / 4) * (domainY[1] - domainY[0]));

  // Connected solid Pareto frontier path
  const frontierLinePath = sortedFrontier.length > 1
    ? sortedFrontier
        .map((s, idx) => {
          const sx = scaleX(s.objective_values[xAxisKey] ?? 0);
          const sy = scaleY(s.objective_values[yAxisKey] ?? 0);
          return `${idx === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
        })
        .join(" ")
    : null;

  // Frontier subtle area fill
  const frontierAreaPath = sortedFrontier.length > 1 && frontierLinePath
    ? `${frontierLinePath} L ${scaleX(sortedFrontier[sortedFrontier.length - 1].objective_values[xAxisKey] ?? 0).toFixed(1)} ${(margin.top + plotHeight).toFixed(1)} L ${scaleX(sortedFrontier[0].objective_values[xAxisKey] ?? 0).toFixed(1)} ${(margin.top + plotHeight).toFixed(1)} Z`
    : null;

  // Selected candidate coordinates
  const selectedCoords = selectedPoint
    ? {
        x: scaleX(selectedPoint.x),
        y: scaleY(selectedPoint.y),
      }
    : null;

  // Active point for popover: only display when hovered to prevent unpredictable jumping
  const activePoint = hoveredPoint;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3 relative">
      {/* Chart Top Control Bar: Title & Axis Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Optimization Landscape
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-indigo-200 bg-indigo-50 text-accent font-medium">
              {frontierScenarios.length} Frontier · {dominatedScenarios.length} Dominated
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Pareto-optimal policies reveal the best trade-offs between conversion and merchant revenue.
          </p>
        </div>

        {/* Axis Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-textTertiary font-medium">X-Axis:</span>
            <select
              value={xAxisKey}
              onChange={(e) => onXAxisKeyChange(e.target.value)}
              className="px-2 py-1 rounded-md border border-hairline bg-canvas text-xs font-medium text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="conversion_rate_percent">Capture Conversion Rate (%)</option>
              <option value="total_processing_fees_inr">Gateway Processing Fees (₹)</option>
              <option value="failure_rate_percent">Terminal Failure Rate (%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-textTertiary font-medium">Y-Axis:</span>
            <select
              value={yAxisKey}
              onChange={(e) => onYAxisKeyChange(e.target.value)}
              className="px-2 py-1 rounded-md border border-hairline bg-canvas text-xs font-medium text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="net_merchant_revenue_inr">Net Merchant Revenue (₹)</option>
              <option value="conversion_rate_percent">Capture Conversion Rate (%)</option>
              <option value="total_processing_fees_inr">Gateway Processing Fees (₹)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SVG Optimization Chart Instrument & Anchored Popover Canvas */}
      <div className="w-full overflow-x-auto">
        <div className="relative inline-block w-full min-w-[640px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none block"
          >
            <defs>
              {/* Soft gradient fill under the frontier line */}
              <linearGradient id="frontierAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
              </linearGradient>

              {/* Frontier node drop-shadow */}
              <filter id="frontierNodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Plot Surface Background */}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="1"
              rx="2"
            />

            {/* Vertical Gridlines & Ticks */}
            {xTicks.map((tick, idx) => {
              const x = scaleX(tick);
              return (
                <g key={`xtick-${idx}`}>
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + plotHeight}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={x}
                    y={margin.top + plotHeight + 16}
                    fill="#6b7280"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    textAnchor="middle"
                  >
                    {formatTick(tick, xAxisKey)}
                  </text>
                </g>
              );
            })}

            {/* Horizontal Gridlines & Ticks */}
            {yTicks.map((tick, idx) => {
              const y = scaleY(tick);
              return (
                <g key={`ytick-${idx}`}>
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
                    fill="#6b7280"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    textAnchor="end"
                  >
                    {formatTick(tick, yAxisKey)}
                  </text>
                </g>
              );
            })}

            {/* Subtly Indicated "Preferred Direction" (Upper-Right) */}
            <g
              transform={`translate(${margin.left + plotWidth - 14}, ${margin.top + 16})`}
              className="opacity-75"
            >
              <line x1="-120" y1="0" x2="-8" y2="0" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="2,2" />
              <text
                x="-14"
                y="-4"
                fill="#64748b"
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight="500"
                textAnchor="end"
              >
                Preferred Direction ↗
              </text>
              <path
                d="M -4 -4 L 0 0 L -4 4"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Axis Labels */}
            <text
              x={margin.left + plotWidth / 2}
              y={height - 14}
              fill="#111827"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="600"
              textAnchor="middle"
            >
              {axisLabels[xAxisKey]?.label || xAxisKey}
            </text>

            <text
              x={-(margin.top + plotHeight / 2)}
              y={24}
              transform="rotate(-90)"
              fill="#111827"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="600"
              textAnchor="middle"
            >
              {axisLabels[yAxisKey]?.label || yAxisKey}
            </text>

            {/* Frontier Shaded Region */}
            {frontierAreaPath && (
              <path
                d={frontierAreaPath}
                fill="url(#frontierAreaGradient)"
                opacity="0.9"
              />
            )}

            {/* Solid Stepped / Connected Frontier Trade-off Line */}
            {frontierLinePath && (
              <path
                d={frontierLinePath}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 1. Muted Dominated Candidate Points (Background Context) */}
            {dominatedScenarios.map((s) => {
              const x = scaleX(s.objective_values[xAxisKey] ?? 0);
              const y = scaleY(s.objective_values[yAxisKey] ?? 0);
              const isSelected = selectedCandidateId === s.scenario_id;

              return (
                <g
                  key={s.scenario_id}
                  className="cursor-pointer"
                  onClick={() => onSelectCandidate(s)}
                  onMouseEnter={() => {
                    setHoveredPoint({
                      id: s.scenario_id,
                      name: s.scenario_name,
                      x: s.objective_values[xAxisKey] ?? 0,
                      y: s.objective_values[yAxisKey] ?? 0,
                      type: "dominated",
                      params: s.parameter_values,
                      dominates: s.dominates_count,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible comfortable hit target (r=12) */}
                  <circle cx={x} cy={y} r={12} fill="transparent" />
                  {/* Visible point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5.5 : 3.5}
                    fill={isSelected ? "#1e3a8a" : "#94a3b8"}
                    opacity={isSelected ? 1 : 0.55}
                    stroke={isSelected ? "#ffffff" : "#cbd5e1"}
                    strokeWidth={isSelected ? 2 : 0.75}
                    className="transition-[r,fill,opacity] duration-150 hover:opacity-100"
                  />
                </g>
              );
            })}

            {/* 2. Infeasible Candidates (If any exist) */}
            {infeasibleScenarios.map((s) => {
              const x = scaleX(s.metric_values[xAxisKey] ?? 0);
              const y = scaleY(s.metric_values[yAxisKey] ?? 0);
              const isSelected = selectedCandidateId === s.scenario_id;

              return (
                <g
                  key={s.scenario_id}
                  className="cursor-pointer"
                  onClick={() => onSelectCandidate(s)}
                  onMouseEnter={() => {
                    setHoveredPoint({
                      id: s.scenario_id,
                      name: s.scenario_name,
                      x: s.metric_values[xAxisKey] ?? 0,
                      y: s.metric_values[yAxisKey] ?? 0,
                      type: "infeasible",
                      params: s.parameter_values,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle cx={x} cy={y} r={12} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5 : 3}
                    fill="#fca5a5"
                    opacity={isSelected ? 1 : 0.4}
                    stroke="#ef4444"
                    strokeWidth={1}
                    className="transition-all duration-150 hover:opacity-100"
                  />
                </g>
              );
            })}

            {/* 3. Empirical Baseline Reference Treatment */}
            {basePoint && (() => {
              const bx = scaleX(basePoint.x);
              const by = scaleY(basePoint.y);

              return (
                <g
                  key="baseline-reference-marker"
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectCandidate({
                      scenario_id: "baseline",
                      scenario_name: "Empirical Baseline",
                      objective_values: baselineSummary ?? {},
                      is_pareto_optimal: false,
                      dominated_by: [],
                      dominates_count: 0,
                    } as any);
                  }}
                  onMouseEnter={() => {
                    setHoveredPoint({
                      id: "baseline",
                      name: "Empirical Baseline",
                      x: basePoint.x,
                      y: basePoint.y,
                      type: "baseline",
                      params: baselineSummary,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible hit target */}
                  <circle cx={bx} cy={by} r={18} fill="transparent" />

                  {/* Subtle Reference Guides to Axes */}
                  <line
                    x1={bx}
                    y1={by}
                    x2={bx}
                    y2={margin.top + plotHeight}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                  <line
                    x1={margin.left}
                    y1={by}
                    x2={bx}
                    y2={by}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />

                  {/* Baseline Tag Badge */}
                  <g transform={`translate(${bx}, ${by - 14})`}>
                    <rect
                      x="-24"
                      y="-12"
                      width="48"
                      height="14"
                      rx="3"
                      fill="#fffbeb"
                      stroke="#f59e0b"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fill="#b45309"
                      fontSize="8.5"
                      fontFamily="sans-serif"
                      fontWeight="700"
                      letterSpacing="0.02em"
                    >
                      Baseline
                    </text>
                  </g>

                  {/* Distinct Diamond Reference Marker */}
                  <rect
                    x={bx - 4.5}
                    y={by - 4.5}
                    width="9"
                    height="9"
                    transform={`rotate(45, ${bx}, ${by})`}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })()}

            {/* 4. Prominent Pareto-Optimal Frontier Points */}
            {frontierScenarios.map((s) => {
              const x = scaleX(s.objective_values[xAxisKey] ?? 0);
              const y = scaleY(s.objective_values[yAxisKey] ?? 0);
              const isSelected = selectedCandidateId === s.scenario_id;

              return (
                <g
                  key={s.scenario_id}
                  className="cursor-pointer"
                  onClick={() => onSelectCandidate(s)}
                  onMouseEnter={() => {
                    setHoveredPoint({
                      id: s.scenario_id,
                      name: s.scenario_name,
                      x: s.objective_values[xAxisKey] ?? 0,
                      y: s.objective_values[yAxisKey] ?? 0,
                      type: "frontier",
                      params: s.parameter_values,
                      dominates: s.dominates_count,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible generous hit target (r=16) */}
                  <circle cx={x} cy={y} r={16} fill="transparent" />

                  {/* Prominent Outer Ring for Frontier Candidates */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 9 : 6.5}
                    fill="#1e3a8a"
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="url(#frontierNodeShadow)"
                  />

                  {/* Center Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 4 : 2.5}
                    fill="#ffffff"
                  />
                </g>
              );
            })}

            {/* 5. Selected Candidate Active Highlight Ring on SVG */}
            {selectedCoords && (
              <circle
                cx={selectedCoords.x}
                cy={selectedCoords.y}
                r={13}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeDasharray="3,2"
                className="pointer-events-none"
              />
            )}
          </svg>

          {/* Stable Anchored Tooltip Popover Layer */}
          {activePoint && (() => {
            const svgX = scaleX(activePoint.x);
            const svgY = scaleY(activePoint.y);
            const leftPct = (svgX / width) * 100;
            const topPct = (svgY / height) * 100;
            const placement = getTooltipPlacement(svgX, svgY);
            const isFrontier = activePoint.type === "frontier";
            const isBaseline = activePoint.type === "baseline";
            const candidateName = activePoint.name.split("(")[0]?.trim() || activePoint.id;
            const policySummary = formatPolicySummary(activePoint.params);

            return (
              <div
                className="absolute z-20 pointer-events-none select-none transition-[left,top,transform] duration-150 ease-out"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: placement.transform,
                }}
              >
                <div className="rounded-md border border-hairline bg-surface p-3 shadow-dropdown min-w-[240px] max-w-[280px] space-y-2">
                  {/* Header: Candidate # and Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-hairline/70 pb-2">
                    <span className="font-bold text-textPrimary text-xs truncate">
                      {isBaseline ? "Empirical Baseline" : candidateName}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                        isFrontier
                          ? "bg-indigo-50 text-accent border border-indigo-200"
                          : isBaseline
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      )}
                    >
                      {isFrontier ? "Pareto-Optimal" : isBaseline ? "Baseline" : "Dominated"}
                    </span>
                  </div>

                  {/* Metric Rows */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-textSecondary text-[11px]">
                        {axisLabels[xAxisKey]?.label || xAxisKey}
                      </span>
                      <span className="font-mono font-semibold text-textPrimary tabular-nums">
                        {formatPreciseMetric(activePoint.x, xAxisKey)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-textSecondary text-[11px]">
                        {axisLabels[yAxisKey]?.label || yAxisKey}
                      </span>
                      <span className="font-mono font-semibold text-textPrimary tabular-nums">
                        {formatPreciseMetric(activePoint.y, yAxisKey)}
                      </span>
                    </div>
                  </div>

                  {/* Policy Parameters Section */}
                  {activePoint.params && !isBaseline && (
                    <div className="pt-2 border-t border-hairline/70 space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-textTertiary block">
                        Policy Parameters
                      </span>
                      <span className="text-[11px] font-medium text-textPrimary block">
                        {policySummary}
                      </span>
                    </div>
                  )}

                  {/* Dominance Note */}
                  {activePoint.dominates !== undefined && activePoint.dominates > 0 && (
                    <div className="text-[10px] text-accent font-medium pt-0.5 border-t border-hairline/40">
                      Outperforms {activePoint.dominates} dominated candidate{activePoint.dominates === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Compact Analytical Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2.5 border-t border-hairline/70">
        <div className="flex items-center gap-5 text-[11px] font-sans text-textSecondary">
          {/* Pareto-optimal */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center">
              <span className="w-3 h-0.5 bg-accent inline-block" />
              <span className="size-2.5 rounded-full bg-accent border border-white -ml-1" />
            </span>
            <span className="font-semibold text-textPrimary">Pareto-optimal ({frontierScenarios.length})</span>
          </div>

          {/* Dominated */}
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-400 opacity-60" />
            <span>Dominated ({dominatedScenarios.length})</span>
          </div>

          {/* Baseline */}
          {basePoint && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rotate-45 bg-amber-500 inline-block" />
              <span>Baseline</span>
            </div>
          )}

          {/* Selected */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-accent border-dashed" />
            <span>Selected</span>
          </div>
        </div>

        <span className="text-[10px] text-textTertiary font-mono">
          Click any candidate to open policy inspector & trade-off rationale
        </span>
      </div>
    </div>
  );
};
