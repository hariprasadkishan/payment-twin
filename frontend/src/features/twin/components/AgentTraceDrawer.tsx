import React from "react";
import { AgentSimulationResult } from "@/types/simulation";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight } from "lucide-react";

interface AgentTraceDrawerProps {
  trace: AgentSimulationResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentTraceDrawer: React.FC<AgentTraceDrawerProps> = ({
  trace,
  isOpen,
  onClose,
}) => {
  if (!trace) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Agent Trace: ${trace.agent_id}`}
      description={`Archetype: ${trace.archetype.replace(/_/g, " ")} • Traversal Duration: ${trace.total_duration_ms}ms`}
      className="max-w-lg"
    >
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] text-xs">
        {/* Outcome & Archetype Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={trace.is_successful ? "success" : "danger"} size="md" dot>
              {trace.is_successful ? "PAYMENT CAPTURED" : trace.terminal_reason || "TERMINAL DECLINE"}
            </Badge>
            <Badge variant="neutral" size="md">
              {trace.archetype.replace(/_/g, " ")}
            </Badge>
          </div>
          <span className="font-mono text-textTertiary text-xs">
            {trace.total_attempts} attempt{trace.total_attempts > 1 ? "s" : ""}
          </span>
        </div>

        {/* Transaction Summary Strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase tracking-wider block">Ticket Amount</span>
            <span className="text-sm font-semibold font-mono text-textPrimary tabular-nums">
              ₹{trace.amount_inr.toFixed(0)}
            </span>
          </div>
          <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase tracking-wider block">Processing Fee</span>
            <span className="text-sm font-semibold font-mono text-textPrimary tabular-nums">
              ₹{trace.fee_inr.toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase tracking-wider block">Final Rail</span>
            <span className="text-sm font-semibold font-mono uppercase text-textPrimary truncate block">
              {trace.final_method}
            </span>
          </div>
        </div>

        {/* Chronological Event Log */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold text-textSecondary tracking-wider">
              Chronological State Machine Log
            </span>
            <span className="text-[10px] text-textTertiary font-mono">
              {trace.event_trace.length} events recorded
            </span>
          </div>

          <div className="space-y-2">
            {trace.event_trace.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-accent font-mono uppercase text-[11px]">
                    {evt.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-mono text-textTertiary">
                    +{evt.timestamp_ms}ms
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-textSecondary font-mono">
                  <span className="text-textTertiary">{evt.state_from}</span>
                  <ArrowRight className="size-3 text-textTertiary shrink-0" />
                  <span className="font-semibold text-textPrimary">{evt.state_to}</span>
                </div>

                {evt.method && (
                  <div className="text-[11px] text-textTertiary pt-1 border-t border-hairline/60 flex items-center justify-between">
                    <span>Method: <strong className="text-textSecondary uppercase">{evt.method}</strong></span>
                    <span>Attempt #{evt.attempt_number}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
