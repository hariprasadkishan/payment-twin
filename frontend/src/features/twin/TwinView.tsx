import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlayCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const TwinView: React.FC = () => {
  const { setActivePage } = useAppStore();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <EmptyState
        icon={PlayCircle}
        title="Payment Twin Simulation Engine Ready"
        description="Simulates synthetic Customer Agents navigating through the full discrete-event checkout funnel (Landing → Cart → Checkout → Method → Auth → Gateway → Terminal Result)."
        statusBadge="SIMULATION ENGINE STANDBY"
        actionLabel="Configure What-If Scenario"
        onAction={() => setActivePage("scenarios")}
      />

      {/* Funnel Stage Architecture Preview */}
      <div className="p-6 rounded-xl border border-twin-border bg-twin-card/30 space-y-4">
        <h4 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
          Funnel Architecture Stages (Discrete-Event Model)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
          {["Landing", "Cart", "Checkout", "Method Selection", "Auth / 3DS", "Bank Gateway", "Capture / Retry"].map((stage, i) => (
            <div key={stage} className="p-3 rounded-lg bg-twin-card/60 border border-twin-border space-y-1">
              <span className="text-[10px] font-mono text-twin-cyan">0{i + 1}</span>
              <div className="font-semibold text-twin-white truncate">{stage}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
