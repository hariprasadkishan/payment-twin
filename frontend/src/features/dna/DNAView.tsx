import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dna, Layers, TrendingUp, DollarSign } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const DNAView: React.FC = () => {
  const { setActivePage } = useAppStore();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <EmptyState
        icon={Dna}
        title="No Behavioral DNA Profile Established"
        description="Behavioral DNA requires observed payment records to calculate empirical priors, Wilson 95% confidence intervals, and log-normal amount distributions."
        statusBadge="DNA UNAVAILABLE"
        actionLabel="Go to Ingestion & Settings"
        onAction={() => setActivePage("settings")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
          <Layers className="w-5 h-5 text-twin-cyan" />
          <h4 className="text-xs font-semibold text-twin-white">Method Priors & Shares</h4>
          <p className="text-[11px] text-twin-slate leading-relaxed">
            Measures empirical payment method selection preferences (UPI, Cards, Netbanking) conditioned on ticket size.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
          <TrendingUp className="w-5 h-5 text-twin-indigo" />
          <h4 className="text-xs font-semibold text-twin-white">Success & Failure Dynamics</h4>
          <p className="text-[11px] text-twin-slate leading-relaxed">
            Profiles capture rates per payment rail and issuing bank with Wilson score analytical confidence bounds.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
          <DollarSign className="w-5 h-5 text-twin-success" />
          <h4 className="text-xs font-semibold text-twin-white">Ticket Size & Quantiles</h4>
          <p className="text-[11px] text-twin-slate leading-relaxed">
            Estimates continuous amount distributions using Log-normal MLE fit and robust non-parametric percentiles.
          </p>
        </div>
      </div>
    </div>
  );
};
