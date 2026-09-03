import React from "react";
import { MonteCarloSimulationResult } from "@/types/simulation";
import { Layers } from "lucide-react";

interface MonteCarloUncertaintyPanelProps {
  result: MonteCarloSimulationResult;
}

export const MonteCarloUncertaintyPanel: React.FC<MonteCarloUncertaintyPanelProps> = ({
  result,
}) => {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Monte Carlo Uncertainty Analysis ({result.total_runs} Independent Runs)
            </h3>
          </div>
          <p className="text-xs text-textSecondary">
            Stochastic variance distributions aggregated across {result.total_runs} simulation sweeps ({result.population_per_run.toLocaleString()} agents each) to quantify estimation error and 95% confidence intervals.
          </p>
        </div>
        <span className="text-[10px] font-mono text-textTertiary tabular-nums">
          Executed in {result.execution_duration_ms.toFixed(1)}ms
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(result.summary_metrics).map(([metricKey, dist]) => {
          const isRate = metricKey.includes("rate") || metricKey.includes("percent");

          const formatMetric = (v: number) => {
            if (isRate) return `${v.toFixed(1)}%`;
            return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
          };

          return (
            <div
              key={metricKey}
              className="p-3.5 rounded-md border border-hairline bg-canvas/40 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-textPrimary text-xs capitalize">
                  {metricKey.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] font-mono text-accent bg-blue-50 border border-blue-200 px-1 py-0.5 rounded font-medium">
                  CI: 95%
                </span>
              </div>

              <div className="p-2.5 rounded bg-surface border border-hairline space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-textSecondary text-[11px]">Mean:</span>
                  <span className="text-sm font-bold text-textPrimary tabular-nums">
                    {formatMetric(dist.mean)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-textSecondary text-[11px]">95% CI Range:</span>
                  <span className="font-semibold text-accent tabular-nums">
                    [{formatMetric(dist.ci_95[0])} – {formatMetric(dist.ci_95[1])}]
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-1 border-t border-hairline/60 text-[11px] text-textTertiary">
                  <span>Median (p50):</span>
                  <span className="tabular-nums font-medium text-textSecondary">
                    {formatMetric(dist.p50)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-[11px] text-textTertiary">
                  <span>Std Deviation:</span>
                  <span className="tabular-nums">
                    {dist.std_dev.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
