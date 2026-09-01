import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp, Layers, Compass, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const ParetoView: React.FC = () => {
  const { setActivePage } = useAppStore();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <EmptyState
        icon={TrendingUp}
        title="Pareto Multi-Objective Frontier Standby"
        description="Evaluates candidate parameter spaces across competing merchant objectives (Max Net Revenue, Max Conversion, Min Processing Fees) and extracts the non-dominated Pareto frontier."
        statusBadge="OPTIMIZER STANDBY"
        actionLabel="Go to What-If Studio"
        onAction={() => setActivePage("scenarios")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
          <Compass className="w-5 h-5 text-twin-cyan" />
          <h4 className="text-xs font-semibold text-twin-white">Non-Dominated Sorting</h4>
          <p className="text-[11px] text-twin-slate leading-relaxed">
            Partitions scenarios into Pareto frontier candidates vs dominated strategies based on strict mathematical dominance.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
          <Layers className="w-5 h-5 text-twin-indigo" />
          <h4 className="text-xs font-semibold text-twin-white">Feasibility Constraints</h4>
          <p className="text-[11px] text-twin-slate leading-relaxed">
            Filters out candidate solutions that breach merchant operational boundaries (e.g. minimum acceptable conversion rate).
          </p>
        </div>

        <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
          <CheckCircle className="w-5 h-5 text-twin-success" />
          <h4 className="text-xs font-semibold text-twin-white">Uncertainty Error Whiskers</h4>
          <p className="text-[11px] text-twin-slate leading-relaxed">
            Quantifies standard errors and analytical confidence intervals across Monte Carlo simulation runs.
          </p>
        </div>
      </div>
    </div>
  );
};
