import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const GuardianView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Sentinel Surveillance Health Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-twin-slate/70" />
            <h2 className="text-base font-display font-semibold text-twin-white">
              Sentinel Surveillance Standby
            </h2>
            <Badge variant="neutral" size="sm">UNAVAILABLE</Badge>
          </div>
          <p className="text-xs text-twin-slate">
            Guardian requires a minimum of 30 recent payment records and an established Behavioral DNA baseline to execute drift detectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1.5 rounded-md bg-twin-card border border-twin-border font-mono text-twin-slate">
            FDR CONTROL: <span className="text-twin-cyan">Q = 0.05</span>
          </div>
        </div>
      </div>

      {/* Alert Feed Empty State */}
      <EmptyState
        icon={ShieldCheck}
        title="Zero Active Anomaly Alerts"
        description="When telemetry drift is detected across payment capture rates, error reasons, or bank decline surges, alerts will appear here with statistical evidence and one-click Twin handoffs."
        statusBadge="ALL SYSTEMS NOMINAL"
      />
    </div>
  );
};
