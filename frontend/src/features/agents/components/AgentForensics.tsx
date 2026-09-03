import React, { useState, useMemo } from "react";
import { CustomerAgent, AgentArchetype } from "@/types/agent";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, FileText, ChevronRight, SlidersHorizontal } from "lucide-react";

interface AgentForensicsProps {
  agents: CustomerAgent[];
  selectedArchetype: AgentArchetype | "ALL" | null;
  onSelectAgent: (agent: CustomerAgent) => void;
}

export const AgentForensics: React.FC<AgentForensicsProps> = ({
  agents,
  selectedArchetype,
  onSelectAgent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const archetypeBadgeTones: Record<AgentArchetype, { variant: "info" | "neutral" | "warning" | "success" }> = {
    FAST_CHECKOUT: { variant: "info" },
    PATIENT_RETRYER: { variant: "neutral" },
    METHOD_SWITCHER: { variant: "warning" },
    HIGH_TICKET: { variant: "success" },
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      // Archetype filter
      if (selectedArchetype && selectedArchetype !== "ALL" && a.archetype !== selectedArchetype) {
        return false;
      }
      // Method filter
      if (methodFilter !== "ALL" && a.observed_preferences.primary_method.toLowerCase() !== methodFilter.toLowerCase()) {
        return false;
      }
      // Search query (ID or sub_instrument)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = a.agent_id.toLowerCase().includes(q);
        const matchesMethod = a.observed_preferences.primary_method.toLowerCase().includes(q);
        const matchesInst = (a.observed_preferences.sub_instrument || "").toLowerCase().includes(q);
        if (!matchesId && !matchesMethod && !matchesInst) return false;
      }
      return true;
    });
  }, [agents, selectedArchetype, methodFilter, searchQuery]);

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileText className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Sampled Agent Forensics & Cohort Audit
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Audit Log
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Inspect individual state-machine parameters, behavioral sensitivity thresholds, and basket preferences.
          </p>
        </div>

        {/* Search & Filter Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="size-3.5 text-textTertiary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search agent ID or method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-md border border-hairline bg-canvas/60 pl-8 pr-3 text-xs text-textPrimary placeholder:text-textTertiary focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          {/* Payment Method Selector */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-8 rounded-md border border-hairline bg-canvas/60 px-2.5 text-xs text-textSecondary focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent font-medium"
            aria-label="Filter by payment method"
          >
            <option value="ALL">All Payment Rails</option>
            <option value="upi">UPI</option>
            <option value="card">Cards</option>
            <option value="netbanking">Netbanking</option>
          </select>
        </div>
      </div>

      {/* Counter & Active Filter Strip */}
      <div className="flex items-center justify-between text-xs text-textTertiary pb-1">
        <span>
          Showing <strong className="text-textPrimary font-semibold tabular-nums">{filteredAgents.length}</strong> of {agents.length} sampled agents
        </span>
        {selectedArchetype && selectedArchetype !== "ALL" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
            <SlidersHorizontal className="size-3" />
            <span>Cohort: {selectedArchetype.replace(/_/g, " ")}</span>
          </span>
        )}
      </div>

      {/* High-density Forensic Audit Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent ID</TableHead>
              <TableHead>Archetype</TableHead>
              <TableHead>Primary Rail</TableHead>
              <TableHead>Basket Size</TableHead>
              <TableHead>Max Retries</TableHead>
              <TableHead>Retry Propensity</TableHead>
              <TableHead>Friction Sens.</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-textTertiary">
                  No synthetic agents match the current filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow
                  key={agent.agent_id}
                  onClick={() => onSelectAgent(agent)}
                  className="cursor-pointer hover:bg-subtle/50 transition-colors text-xs"
                >
                  <TableCell className="font-mono font-medium text-accent">
                    {agent.agent_id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={archetypeBadgeTones[agent.archetype]?.variant || "neutral"}
                      size="sm"
                    >
                      {agent.archetype.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="uppercase font-medium text-textPrimary">
                    {agent.observed_preferences.primary_method}
                    {agent.observed_preferences.sub_instrument && (
                      <span className="text-[10px] text-textTertiary ml-1 lowercase">
                        ({agent.observed_preferences.sub_instrument})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium text-textPrimary">
                    ₹{agent.observed_preferences.transaction_amount_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="tabular-nums text-textSecondary">
                    {agent.latent_parameters.max_retries} {agent.latent_parameters.max_retries === 1 ? "attempt" : "attempts"}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium text-textPrimary">
                    {(agent.latent_parameters.retry_propensity * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="tabular-nums text-textSecondary">
                    {(agent.latent_parameters.friction_sensitivity * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAgent(agent);
                      }}
                      className="text-xs text-textSecondary hover:text-accent"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="size-3 ml-0.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

