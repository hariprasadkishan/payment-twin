import React from "react";
import { GuardianTwinHandoff } from "@/types/guardian";
import { ShieldAlert, X } from "lucide-react";

interface GuardianContextAlertProps {
  handoff: GuardianTwinHandoff;
  onDismiss: () => void;
}

export const GuardianContextAlert: React.FC<GuardianContextAlertProps> = ({
  handoff,
  onDismiss,
}) => {
  return (
    <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <ShieldAlert className="size-4 text-amber-600 shrink-0" strokeWidth={1.75} />
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
            <span>Guardian Telemetry Anomaly Loaded:</span>
            <span className="uppercase text-amber-800 font-mono">
              {handoff.anomaly_type.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-[11px] text-textSecondary font-mono tabular-nums">
            Target: <strong className="text-textPrimary font-semibold uppercase">{handoff.target_entity}</strong> • 
            Observed Shift: <strong className="text-red-700 font-semibold">{(handoff.delta * 100).toFixed(1)}% Δ</strong> • 
            Est. Revenue at Risk: <strong className="text-amber-800 font-semibold">₹{handoff.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-textTertiary hover:text-textPrimary flex items-center gap-1 self-end sm:self-center font-medium p-1 rounded hover:bg-amber-100/50 transition-colors"
      >
        <X className="size-3.5" />
        <span>Dismiss</span>
      </button>
    </div>
  );
};
