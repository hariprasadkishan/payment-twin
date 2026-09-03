import React from "react";
import { GuardianAlert, AlertSeverity, AlertStatus } from "@/types/guardian";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Check, 
  CheckCheck, 
  ArrowRight, 
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertDetailDrawerProps {
  alert: GuardianAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onHandoffToTwin: (alert: GuardianAlert) => void;
  isAcknowledging?: boolean;
  isResolving?: boolean;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  alert,
  isOpen,
  onClose,
  onAcknowledge,
  onResolve,
  onHandoffToTwin,
  isAcknowledging = false,
  isResolving = false,
}) => {
  if (!alert) return null;

  const severityBadgeVariant = (sev: AlertSeverity) => {
    switch (sev) {
      case "CRITICAL":
      case "HIGH":
        return "danger" as const;
      case "MEDIUM":
        return "warning" as const;
      case "LOW":
        return "info" as const;
      default:
        return "neutral" as const;
    }
  };

  const statusBadgeVariant = (st: AlertStatus) => {
    switch (st) {
      case "OPEN":
        return "danger" as const;
      case "ACKNOWLEDGED":
        return "warning" as const;
      case "RESOLVED":
      case "RECOVERED":
        return "success" as const;
      default:
        return "neutral" as const;
    }
  };

  const isDegraded = alert.observed_value < alert.baseline_value;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={alert.metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      description={`Fingerprint: ${alert.fingerprint} • ${alert.window_description}`}
      className="max-w-lg"
    >
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] text-xs">
        {/* Status & Severity Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={severityBadgeVariant(alert.severity)} size="md">
              Severity: {alert.severity}
            </Badge>
            <Badge variant={statusBadgeVariant(alert.status)} size="md" dot>
              {alert.status}
            </Badge>
          </div>
          <span className="text-[11px] text-textTertiary font-mono">
            {alert.consecutive_windows} window{alert.consecutive_windows > 1 ? "s" : ""} consecutive
          </span>
        </div>

        {/* 1. Metric Degradation Summary */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase font-semibold text-textSecondary tracking-wider block">
            1. Metric Degradation Summary
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
              <span className="text-[10px] text-textTertiary block uppercase tracking-wider">Baseline</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-textPrimary">
                {(alert.baseline_value * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
              <span className="text-[10px] text-textTertiary block uppercase tracking-wider">Observed</span>
              <span className={cn("text-sm font-semibold font-mono tabular-nums", isDegraded ? "text-red-700" : "text-emerald-700")}>
                {(alert.observed_value * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
              <span className="text-[10px] text-textTertiary block uppercase tracking-wider">Delta (Δ)</span>
              <span className={cn("text-sm font-semibold font-mono tabular-nums", isDegraded ? "text-red-700" : "text-emerald-700")}>
                {(alert.absolute_delta * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Statistical Evidence & Dual Gate */}
        <div className="p-3.5 rounded-md bg-canvas/60 border border-hairline space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold text-textSecondary tracking-wider">
              2. Statistical Evidence (Dual Gate)
            </span>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
              Dual Breached
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-textSecondary">
              <span>Detector Algorithm:</span>
              <span className="font-mono text-textPrimary font-semibold">{alert.detector}</span>
            </div>
            <div className="flex justify-between text-textSecondary">
              <span>Test Statistic:</span>
              <span className="font-mono text-textPrimary font-semibold">{alert.test_statistic.toFixed(4)}</span>
            </div>
            {alert.p_value_raw !== null && alert.p_value_raw !== undefined && (
              <div className="flex justify-between text-textSecondary">
                <span>Raw p-value:</span>
                <span className="font-mono text-textPrimary">{alert.p_value_raw.toExponential(3)}</span>
              </div>
            )}
            {alert.p_value_adjusted_fdr !== null && alert.p_value_adjusted_fdr !== undefined && (
              <div className="flex justify-between text-textSecondary">
                <span>FDR-Adjusted q-value:</span>
                <span className="font-mono text-accent font-bold">
                  {alert.p_value_adjusted_fdr.toExponential(3)} (α = 0.05)
                </span>
              </div>
            )}
            <div className="flex justify-between text-textSecondary pt-1 border-t border-hairline">
              <span>Sample Sizes:</span>
              <span className="font-mono text-textPrimary">
                Recent: {alert.sample_size_recent} • Base: {alert.sample_size_baseline}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Business Impact Estimation */}
        {alert.business_impact && (
          <div className="p-3.5 rounded-md bg-canvas/60 border border-hairline space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-semibold text-textSecondary tracking-wider">
                3. Quantified Business Impact
              </span>
              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                Statistical Projection
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-textTertiary block">Observed Failed Orders</span>
                <span className="font-mono font-semibold text-textPrimary text-sm">
                  {alert.business_impact.observed_failed_orders} orders
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-textTertiary block">Excess Declines (Over Baseline)</span>
                <span className="font-mono font-semibold text-red-700 text-sm">
                  +{alert.business_impact.excess_failed_orders} orders
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-hairline flex items-center justify-between">
              <span className="text-[11px] font-medium text-textSecondary">Est. Revenue at Risk:</span>
              <span className="text-base font-bold font-mono text-amber-700 tabular-nums">
                ₹{alert.business_impact.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-[10px] text-textTertiary leading-normal">
              Note: Revenue at risk is an empirical statistical projection derived from baseline average order value (AOV) and does not represent audited accounting losses.
            </p>
          </div>
        )}

        {/* 4. Diagnostic Associations */}
        {alert.diagnostic_associations && alert.diagnostic_associations.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-semibold text-textSecondary tracking-wider block">
              4. Diagnostic Associations
            </span>
            <div className="space-y-2">
              {alert.diagnostic_associations.map((assoc, idx) => (
                <div key={idx} className="p-3 rounded-md bg-canvas/60 border border-hairline space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-textPrimary">
                    <span>{assoc.entity_name} ({assoc.entity_type})</span>
                    <span className="text-red-700 font-mono">
                      {(assoc.relative_contribution_percent).toFixed(1)}% excess share
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary leading-relaxed">
                    {assoc.association_statement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Lifecycle Actions */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] uppercase font-semibold text-textSecondary tracking-wider block">
            5. Operational Lifecycle
          </span>
          <div className="flex items-center gap-2">
            {alert.status === "OPEN" && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                isLoading={isAcknowledging}
                onClick={() => onAcknowledge(alert.alert_id)}
              >
                <Check className="size-3.5 text-accent" />
                <span>Acknowledge Alert</span>
              </Button>
            )}

            {alert.status !== "RESOLVED" && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                isLoading={isResolving}
                onClick={() => onResolve(alert.alert_id)}
              >
                <CheckCheck className="size-3.5 text-emerald-600" />
                <span>Mark Resolved</span>
              </Button>
            )}
          </div>
        </div>

        {/* 6. Payment Twin Counterfactual Handoff */}
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent shrink-0" />
            <span className="text-xs font-semibold text-textPrimary">
              Counterfactual Simulation Handoff
            </span>
          </div>
          <p className="text-[11px] text-textSecondary leading-normal">
            Payment Guardian detects what changed. Use Payment Twin to explore counterfactual interventions (e.g. routing adjustments, alternative payment rails) using synthetic customer agents to evaluate impact before updating production rules.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="w-full shadow-sm text-xs gap-1.5"
            onClick={() => onHandoffToTwin(alert)}
          >
            <span>Explore Scenario in Payment Twin</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
