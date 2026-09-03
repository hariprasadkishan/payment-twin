import React from "react";
import { TwinScenarioHandoff } from "@/types/handoff";
import { GuardianTwinHandoff } from "@/types/guardian";
import { FlaskConical, ShieldAlert, X } from "lucide-react";

interface IncomingHandoffBannersProps {
  twinHandoff: TwinScenarioHandoff | null;
  onDismissTwinHandoff: () => void;
  guardianHandoff: GuardianTwinHandoff | null;
  onDismissGuardianHandoff: () => void;
}

export const IncomingHandoffBanners: React.FC<IncomingHandoffBannersProps> = ({
  twinHandoff,
  onDismissTwinHandoff,
  guardianHandoff,
  onDismissGuardianHandoff,
}) => {
  return (
    <div className="space-y-2">
      {/* Twin Bottleneck Context Banner */}
      {twinHandoff && (
        <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <FlaskConical className="size-4 text-accent shrink-0" strokeWidth={1.75} />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
                <span>Payment Twin Bottleneck Context Loaded:</span>
                <span className="uppercase text-accent font-mono">
                  {twinHandoff.top_bottleneck.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-[11px] text-textSecondary font-mono tabular-nums">
                Identified {twinHandoff.bottleneck_count} dropouts ({twinHandoff.bottleneck_percent}% drag) on {twinHandoff.population_size.toLocaleString()} agents • Baseline Conversion: <strong className="text-textPrimary font-semibold">{twinHandoff.baseline_conversion_rate}%</strong> • Net Revenue: <strong className="text-textPrimary font-semibold">₹{twinHandoff.baseline_net_revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismissTwinHandoff}
            className="text-xs text-textTertiary hover:text-textPrimary flex items-center gap-1 self-end sm:self-center font-medium p-1 rounded hover:bg-blue-100/50 transition-colors"
          >
            <X className="size-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      )}

      {/* Guardian Anomaly Context Banner */}
      {guardianHandoff && (
        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4 text-amber-600 shrink-0" strokeWidth={1.75} />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
                <span>Guardian Surveillance Anomaly Loaded:</span>
                <span className="uppercase text-amber-800 font-mono">
                  {guardianHandoff.anomaly_type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-[11px] text-textSecondary font-mono tabular-nums">
                Target: <strong className="text-textPrimary font-semibold uppercase">{guardianHandoff.target_entity}</strong> • Shift: <strong className="text-red-700 font-semibold">{(guardianHandoff.delta * 100).toFixed(1)}% Δ</strong> • Est. Revenue at Risk: <strong className="text-amber-800 font-semibold">₹{guardianHandoff.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismissGuardianHandoff}
            className="text-xs text-textTertiary hover:text-textPrimary flex items-center gap-1 self-end sm:self-center font-medium p-1 rounded hover:bg-amber-100/50 transition-colors"
          >
            <X className="size-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
};
