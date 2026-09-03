import React, { useState } from "react";
import { DetectorResult, DetectorType } from "@/types/guardian";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Sliders, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticalDetectorBatteryProps {
  detectorResults: DetectorResult[];
}

export const StatisticalDetectorBattery: React.FC<StatisticalDetectorBatteryProps> = ({
  detectorResults,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const detectorLabels: Record<DetectorType, { label: string; desc: string }> = {
    PSI_CATEGORICAL: {
      label: "Population Stability Index (PSI)",
      desc: "Measures macro shift in multinomial categorical distributions (e.g. payment method share).",
    },
    TWO_PROPORTION_ZTEST: {
      label: "Two-Proportion Z-Test",
      desc: "Asymptotic normal test evaluating capture rate differences for high-volume payment rails.",
    },
    FISHER_EXACT: {
      label: "Fisher's Exact Test",
      desc: "Exact hypergeometric distribution test for small-sample bank routes or edge-case decline bins.",
    },
    TWO_SAMPLE_KS: {
      label: "Two-Sample Kolmogorov-Smirnov",
      desc: "Non-parametric distance test comparing full transaction ticket (AOV) empirical distributions.",
    },
    CUSUM_SHIFT: {
      label: "Tabular CUSUM",
      desc: "Sequential change-point detector tracking cumulative mean shifts in sequential failure frequency.",
    },
  };

  const filteredResults = filterType === "ALL"
    ? detectorResults
    : detectorResults.filter((r) => r.detector_type === filterType);

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Statistical Drift Detector Battery
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Dual-Gate Telemetry ({detectorResults.length} Tests)
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Active drift tests executed against empirical Behavioral DNA priors. Alerts require both statistical significance (BH FDR) and commercial effect size.
          </p>
        </div>

        {/* Algorithm Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 rounded-md border border-hairline bg-canvas/60 px-2.5 text-xs text-textSecondary focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent font-medium"
          aria-label="Filter by detector algorithm"
        >
          <option value="ALL">All Detectors ({detectorResults.length})</option>
          <option value="TWO_PROPORTION_ZTEST">Two-Proportion Z-Test</option>
          <option value="PSI_CATEGORICAL">Categorical PSI</option>
          <option value="FISHER_EXACT">Fisher Exact Test</option>
          <option value="TWO_SAMPLE_KS">Two-Sample KS Test</option>
          <option value="CUSUM_SHIFT">Tabular CUSUM</option>
        </select>
      </div>

      {/* High-density Detector Table */}
      <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas/50">
              <TableHead className="w-48">Metric / Dimension</TableHead>
              <TableHead className="w-44">Detector Algorithm</TableHead>
              <TableHead className="text-right">Baseline</TableHead>
              <TableHead className="text-right">Observed</TableHead>
              <TableHead className="text-right">Test Statistic</TableHead>
              <TableHead className="text-center w-28">Statistical Gate</TableHead>
              <TableHead className="text-center w-28">Practical Gate</TableHead>
              <TableHead className="text-right w-24">Dual Verdict</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((res, idx) => {
              const isBreached = res.is_statistically_significant && res.is_practically_significant;

              const formatVal = (val: number, name: string) => {
                if (name.includes("amount") || name.includes("aov")) {
                  return `₹${val.toFixed(0)}`;
                }
                if (name.includes("distribution") || name.includes("psi")) {
                  return val.toFixed(4);
                }
                return `${(val * 100).toFixed(1)}%`;
              };

              return (
                <TableRow key={idx} className="hover:bg-subtle/40 transition-colors">
                  {/* Dimension */}
                  <TableCell className="font-medium text-xs text-textPrimary py-2.5">
                    <div className="space-y-0.5">
                      <span className="font-semibold block">
                        {res.metric_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      {res.target_entity && (
                        <span className="text-[10px] text-textTertiary font-mono block">
                          Target: {res.target_entity}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Algorithm */}
                  <TableCell className="text-xs text-textSecondary font-mono py-2.5">
                    <span
                      title={detectorLabels[res.detector_type]?.desc}
                      className="text-[11px] font-sans font-medium text-textSecondary block cursor-help"
                    >
                      {detectorLabels[res.detector_type]?.label || res.detector_type.replace(/_/g, " ")}
                    </span>
                  </TableCell>

                  {/* Baseline */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2.5">
                    {formatVal(res.baseline_value, res.metric_name)}
                  </TableCell>

                  {/* Observed */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-medium text-textPrimary py-2.5">
                    {formatVal(res.observed_value, res.metric_name)}
                  </TableCell>

                  {/* Test Statistic */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textTertiary py-2.5">
                    {res.test_statistic.toFixed(4)}
                  </TableCell>

                  {/* Statistical Gate */}
                  <TableCell className="text-center py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border font-mono",
                        res.is_statistically_significant
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                    >
                      {res.is_statistically_significant ? "REJECTED" : "PASS"}
                    </span>
                  </TableCell>

                  {/* Practical Gate */}
                  <TableCell className="text-center py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border font-mono",
                        res.is_practically_significant
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-subtle text-textTertiary border-hairline"
                      )}
                    >
                      {res.is_practically_significant ? "SIGNIFICANT" : "WITHIN TOL"}
                    </span>
                  </TableCell>

                  {/* Dual Verdict */}
                  <TableCell className="text-right py-2.5">
                    <Badge
                      variant={isBreached ? "danger" : "neutral"}
                      size="sm"
                      dot={isBreached}
                    >
                      {isBreached ? "ANOMALY" : "STABLE"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dual Significance Gate Methodology Note */}
      <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1.5 text-xs text-textSecondary">
        <div className="flex items-center gap-1.5 font-semibold text-textPrimary text-[11px]">
          <Info className="size-3.5 text-accent" />
          <span>Dual Significance Gate Methodology</span>
        </div>
        <p className="text-[11px] text-textSecondary leading-normal">
          Payment Guardian guards against both false positives and unmeaningful noise. Statistical testing applies Benjamini-Hochberg False Discovery Rate (FDR) control at <strong className="text-textPrimary font-mono">α = 0.05</strong> across simultaneous tests. Practical significance filters out micro-variations by enforcing strict commercial effect sizes (e.g. ≥ 3% capture drop or ≥ 5% rail shift). An operational alert is only created when both gates are breached.
        </p>
      </div>
    </section>
  );
};
