import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bot, Zap, Shield, RefreshCw, Crown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const AgentsView: React.FC = () => {
  const { setActivePage } = useAppStore();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <EmptyState
        icon={Bot}
        title="Customer Agent Population Awaiting DNA Baseline"
        description="Customer Agents are autonomous synthetic decision-makers configured across 4 archetypes (Speed Optimizer, Cautious Transactor, Reluctant Retryer, Premium Shopper)."
        statusBadge="AGENTS UNINITIALIZED"
        actionLabel="Inspect Behavioral DNA"
        onAction={() => setActivePage("dna")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <div className="p-4 rounded-xl border border-twin-cyan/20 bg-twin-cyan/5 space-y-2">
          <div className="flex items-center gap-2 text-twin-cyan">
            <Zap className="w-4 h-4" />
            <h4 className="text-xs font-semibold font-mono">SPEED OPTIMIZER</h4>
          </div>
          <p className="text-[11px] text-twin-slate">
            High UPI affinity, low patience for friction, abandons quickly on latency spikes.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-twin-indigo/20 bg-twin-indigo/5 space-y-2">
          <div className="flex items-center gap-2 text-twin-indigo">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-semibold font-mono">CAUTIOUS TRANSACTOR</h4>
          </div>
          <p className="text-[11px] text-twin-slate">
            Prefers Cards & 3DS verification, willing to retry once with strict security checks.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-twin-warning/20 bg-twin-warning/5 space-y-2">
          <div className="flex items-center gap-2 text-twin-warning">
            <RefreshCw className="w-4 h-4" />
            <h4 className="text-xs font-semibold font-mono">RELUCTANT RETRYER</h4>
          </div>
          <p className="text-[11px] text-twin-slate">
            High abandonment propensity on payment failure unless seamless fallback is offered.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-twin-success/20 bg-twin-success/5 space-y-2">
          <div className="flex items-center gap-2 text-twin-success">
            <Crown className="w-4 h-4" />
            <h4 className="text-xs font-semibold font-mono">PREMIUM SHOPPER</h4>
          </div>
          <p className="text-[11px] text-twin-slate">
            High transaction ticket sizes, high intent to complete purchase across multiple retries.
          </p>
        </div>
      </div>
    </div>
  );
};
