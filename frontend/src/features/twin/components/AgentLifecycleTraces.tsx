import React, { useState } from "react";
import { AgentSimulationResult } from "@/types/simulation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronRight, ArrowRightLeft, Users } from "lucide-react";
import { AgentArchetype } from "@/types/agent";

interface AgentLifecycleTracesProps {
  traces: AgentSimulationResult[];
  onSelectTrace: (trace: AgentSimulationResult) => void;
}

export const AgentLifecycleTraces: React.FC<AgentLifecycleTracesProps> = ({
  traces,
  onSelectTrace,
}) => {
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<string>("ALL");

  const archetypeBadgeVariants: Record<AgentArchetype, "info" | "neutral" | "warning" | "success"> = {
    FAST_CHECKOUT: "info",
    PATIENT_RETRYER: "neutral",
    METHOD_SWITCHER: "warning",
    HIGH_TICKET: "success",
  };

  const filteredTraces = selectedArchetypeFilter === "ALL"
    ? traces
    : traces.filter((t) => t.archetype === selectedArchetypeFilter);

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Synthetic Agent Lifecycle Traces
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Sample Trajectories ({traces.length})
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Discrete state-machine event logs showing how individual customer archetypes navigate friction, retries, and gateway routing.
          </p>
        </div>

        {/* Archetype Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedArchetypeFilter}
            onChange={(e) => setSelectedArchetypeFilter(e.target.value)}
            className="h-8 rounded-md border border-hairline bg-canvas/60 px-2.5 text-xs text-textSecondary focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent font-medium"
            aria-label="Filter traces by archetype"
          >
            <option value="ALL">All Archetypes ({traces.length})</option>
            <option value="FAST_CHECKOUT">Fast Checkout</option>
            <option value="PATIENT_RETRYER">Patient Retryer</option>
            <option value="METHOD_SWITCHER">Method Switcher</option>
            <option value="HIGH_TICKET">High Ticket</option>
          </select>
        </div>
      </div>

      {/* High-density Table */}
      <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas/50">
              <TableHead className="w-32">Agent ID</TableHead>
              <TableHead className="w-36">Archetype</TableHead>
              <TableHead className="text-right">Ticket (INR)</TableHead>
              <TableHead className="w-28">Final Rail</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead className="text-center w-28">Outcome</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTraces.map((trace) => {
              const badgeVariant = archetypeBadgeVariants[trace.archetype] || "neutral";

              return (
                <TableRow
                  key={trace.agent_id}
                  onClick={() => onSelectTrace(trace)}
                  className="hover:bg-subtle/50 transition-colors cursor-pointer group"
                >
                  {/* Agent ID */}
                  <TableCell className="font-mono text-xs font-semibold text-textPrimary py-2.5">
                    {trace.agent_id}
                  </TableCell>

                  {/* Archetype */}
                  <TableCell className="py-2.5">
                    <Badge variant={badgeVariant} size="sm">
                      {trace.archetype.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-medium text-textPrimary py-2.5">
                    ₹{trace.amount_inr.toFixed(0)}
                  </TableCell>

                  {/* Final Rail */}
                  <TableCell className="text-xs font-mono uppercase text-textSecondary py-2.5">
                    <div className="flex items-center gap-1">
                      <span>{trace.final_method}</span>
                      {trace.method_switched && (
                        <span title="Rail switched upon decline" className="text-amber-600">
                          <ArrowRightLeft className="size-3" />
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Attempts */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2.5">
                    {trace.total_attempts}x
                  </TableCell>

                  {/* Outcome */}
                  <TableCell className="text-center py-2.5">
                    <Badge variant={trace.is_successful ? "success" : "danger"} size="sm" dot>
                      {trace.is_successful ? "CAPTURED" : "DECLINED"}
                    </Badge>
                  </TableCell>

                  {/* Duration */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textTertiary py-2.5">
                    {trace.total_duration_ms}ms
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right py-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrace(trace);
                      }}
                      className="text-xs group-hover:text-accent p-1 h-7"
                    >
                      <span>Events</span>
                      <ChevronRight className="size-3 ml-0.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
