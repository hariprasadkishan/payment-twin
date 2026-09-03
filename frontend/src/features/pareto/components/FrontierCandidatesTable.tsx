import React, { useState } from "react";
import { ParetoScenarioItem } from "@/types/optimization";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Award, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface FrontierCandidatesTableProps {
  frontierScenarios: ParetoScenarioItem[];
  dominatedScenarios: ParetoScenarioItem[];
  selectedCandidateId?: string | null;
  onSelectCandidate: (candidate: ParetoScenarioItem) => void;
}

export const FrontierCandidatesTable: React.FC<FrontierCandidatesTableProps> = ({
  frontierScenarios,
  dominatedScenarios,
  selectedCandidateId,
  onSelectCandidate,
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "frontier" | "dominated">("all");

  const displayedScenarios =
    filterTab === "frontier"
      ? frontierScenarios
      : filterTab === "dominated"
      ? dominatedScenarios
      : [...frontierScenarios, ...dominatedScenarios];

  // Helper to format parameter summary
  const formatParams = (params: Record<string, number>) => {
    return Object.entries(params)
      .map(([k, v]) => {
        if (k.includes("rate") || k.includes("success")) return `${(v * 100).toFixed(0)}%`;
        if (k.includes("mdr")) return `${v.toFixed(2)}% MDR`;
        if (k.includes("retries")) return `${v} retries`;
        return `${v}`;
      })
      .join(" • ");
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      {/* Table Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Candidate Operating Policies Evaluation Matrix
            </h3>
          </div>
          <p className="text-xs text-textSecondary">
            Comparative performance ledger displaying evaluated candidate configurations and their respective mathematical dominance standing.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-0.5 rounded-md border border-hairline bg-canvas self-start sm:self-center text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors font-mono",
              filterTab === "all"
                ? "bg-surface text-textPrimary shadow-xs font-semibold"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            All ({frontierScenarios.length + dominatedScenarios.length})
          </button>
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
            Pareto-Optimal ({frontierScenarios.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("dominated")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors font-mono",
              filterTab === "dominated"
                ? "bg-surface text-textPrimary shadow-xs font-semibold"
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
            <TableRow className="bg-canvas/50">
              <TableHead className="w-32">Operating Candidate</TableHead>
              <TableHead>Policy Overrides</TableHead>
              <TableHead className="text-right">Capture Conversion</TableHead>
              <TableHead className="text-right">Net Revenue (INR)</TableHead>
              <TableHead className="text-right">Gateway Fees</TableHead>
              <TableHead className="text-right">Pareto Standing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedScenarios.map((s) => {
              const isSelected = selectedCandidateId === s.scenario_id;
              const isOptimal = s.is_pareto_optimal;
              const conv = s.objective_values.conversion_rate_percent ?? 0;
              const rev = s.objective_values.net_merchant_revenue_inr ?? 0;
              const fees = s.objective_values.total_processing_fees_inr ?? 0;

              return (
                <TableRow
                  key={s.scenario_id}
                  onClick={() => onSelectCandidate(s)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-indigo-50/60 hover:bg-indigo-50/80"
                      : "hover:bg-subtle/50"
                  )}
                >
                  {/* Candidate ID */}
                  <TableCell className="font-mono text-xs font-semibold text-textPrimary py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isOptimal && (
                        <Award className="size-3 text-accent shrink-0" strokeWidth={2} />
                      )}
                      <span className="truncate">{s.scenario_id}</span>
                    </div>
                  </TableCell>

                  {/* Policy Overrides Summary */}
                  <TableCell className="text-xs font-mono text-textSecondary py-2.5">
                    <span className="truncate block max-w-xs">
                      {formatParams(s.parameter_values)}
                    </span>
                  </TableCell>

                  {/* Conversion */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-semibold text-textPrimary py-2.5">
                    {conv.toFixed(1)}%
                  </TableCell>

                  {/* Net Revenue */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-bold text-textPrimary py-2.5">
                    ₹{rev.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>

                  {/* Processing Fees */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2.5">
                    ₹{fees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>

                  {/* Pareto Standing Badge */}
                  <TableCell className="text-right py-2.5">
                    {isOptimal ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-accent bg-indigo-50 border border-indigo-200">
                        Pareto Optimal
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-textTertiary bg-canvas border border-hairline">
                        Dominated ({s.dominated_by?.length ?? 0}x)
                      </span>
                    )}
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
