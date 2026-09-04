import React, { useState } from "react";
import { ParetoScenarioItem } from "@/types/optimization";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Award, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FrontierCandidatesTableProps {
  frontierScenarios: ParetoScenarioItem[];
  dominatedScenarios: ParetoScenarioItem[];
  selectedCandidateId?: string | null;
  preferredCandidateId?: string | null;
  onSelectCandidate: (candidate: ParetoScenarioItem) => void;
}

export const FrontierCandidatesTable: React.FC<FrontierCandidatesTableProps> = ({
  frontierScenarios,
  dominatedScenarios,
  selectedCandidateId,
  preferredCandidateId,
  onSelectCandidate,
}) => {
  const [filterTab, setFilterTab] = useState<"frontier" | "all" | "dominated">("frontier");

  const displayedScenarios =
    filterTab === "frontier"
      ? frontierScenarios
      : filterTab === "dominated"
      ? dominatedScenarios
      : [...frontierScenarios, ...dominatedScenarios];

  // Helper to format parameter summary
  const formatParams = (params: Record<string, number>) => {
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

  // Trade-off descriptor for frontier policies
  const getTradeoffDescriptor = (candidate: ParetoScenarioItem) => {
    const rev = candidate.objective_values.net_merchant_revenue_inr ?? 0;
    const conv = candidate.objective_values.conversion_rate_percent ?? 0;
    const fees = candidate.objective_values.total_processing_fees_inr ?? 0;

    if (!candidate.is_pareto_optimal) {
      return `Dominated by ${candidate.dominated_by?.length ?? 0} policies`;
    }

    // Identify frontier characteristics
    if (fees <= 7550) {
      return "Lowest interchange cost (fee-minimized)";
    }
    if (conv >= 86.8 || rev >= 1650800) {
      return "Peak conversion & net revenue";
    }
    return "Balanced operating trade-off";
  };

  return (
    <div
      aria-label="Frontier Policy Comparison Matrix"
      className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3"
    >
      {/* Table Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Frontier Policy Trade-off Comparison Matrix
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-accent font-semibold">
              {frontierScenarios.length} Non-Dominated
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Direct side-by-side evaluation of operating policies, parameter configurations, and conflicting performance metrics.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-0.5 rounded-md border border-hairline bg-canvas self-start sm:self-center text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("frontier")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors font-mono",
              filterTab === "frontier"
                ? "bg-indigo-50 text-accent border border-indigo-200 font-semibold shadow-xs"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            Frontier Only ({frontierScenarios.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors font-mono",
              filterTab === "all"
                ? "bg-surface text-textPrimary shadow-xs font-semibold border border-hairline"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            All Candidates ({frontierScenarios.length + dominatedScenarios.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("dominated")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors font-mono",
              filterTab === "dominated"
                ? "bg-surface text-textPrimary shadow-xs font-semibold border border-hairline"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            Dominated ({dominatedScenarios.length})
          </button>
        </div>
      </div>

      {/* Primary Table */}
      <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas/50 text-[11px] font-mono text-textSecondary">
              <TableHead className="w-36 py-2.5">Operating Policy</TableHead>
              <TableHead className="py-2.5">Configured Parameters</TableHead>
              <TableHead className="text-right w-36 py-2.5">Conversion (95% CI)</TableHead>
              <TableHead className="text-right w-36 py-2.5">Net Revenue (INR)</TableHead>
              <TableHead className="text-right w-28 py-2.5">Gateway Fees</TableHead>
              <TableHead className="w-56 py-2.5">Trade-off Characterization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedScenarios.map((s) => {
              const isSelected = selectedCandidateId === s.scenario_id;
              const isPreferred = preferredCandidateId === s.scenario_id;
              const isOptimal = s.is_pareto_optimal;
              const conv = s.objective_values.conversion_rate_percent ?? 0;
              const rev = s.objective_values.net_merchant_revenue_inr ?? 0;
              const fees = s.objective_values.total_processing_fees_inr ?? 0;

              // CI bounds
              const convCI = s.uncertainty_bounds?.conversion_rate_percent?.ci_95 as [number, number] | undefined;

              const candidateName = s.scenario_name
                ? s.scenario_name.split("(")[0]?.trim()
                : s.scenario_id.replace(/^cand_/, "Candidate #") || s.scenario_id;

              return (
                <TableRow
                  key={s.scenario_id}
                  onClick={() => onSelectCandidate(s)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-indigo-50/70 hover:bg-indigo-50/90 font-medium"
                      : "hover:bg-subtle/50"
                  )}
                >
                  {/* Candidate Name & Badges */}
                  <TableCell className="font-mono text-xs font-semibold text-textPrimary py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isPreferred ? (
                        <Award className="size-3.5 text-accent shrink-0" strokeWidth={2} />
                      ) : isOptimal ? (
                        <Sparkles className="size-3 text-accent shrink-0" strokeWidth={2} />
                      ) : null}
                      <span className="truncate">{candidateName}</span>
                    </div>
                  </TableCell>

                  {/* Policy Parameters Summary */}
                  <TableCell className="text-xs font-mono text-textSecondary py-2.5">
                    <span className="truncate block max-w-xs font-medium">
                      {formatParams(s.parameter_values)}
                    </span>
                  </TableCell>

                  {/* Conversion + CI */}
                  <TableCell className="text-right text-xs font-mono tabular-nums py-2.5">
                    <span className="font-bold text-textPrimary">{conv.toFixed(1)}%</span>
                    {convCI && (
                      <span className="text-[10px] text-textTertiary block">
                        [{convCI[0].toFixed(1)}, {convCI[1].toFixed(1)}]
                      </span>
                    )}
                  </TableCell>

                  {/* Net Revenue */}
                  <TableCell className="text-right text-xs font-mono tabular-nums py-2.5">
                    <span className="font-bold text-textPrimary">
                      ₹{rev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>

                  {/* Processing Fees */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2.5">
                    ₹{fees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>

                  {/* Trade-off Characterization */}
                  <TableCell className="py-2.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {isOptimal ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-accent bg-indigo-50 border border-indigo-200">
                          {getTradeoffDescriptor(s)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-textTertiary">
                          {getTradeoffDescriptor(s)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
