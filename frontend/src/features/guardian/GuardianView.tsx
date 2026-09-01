import React, { useState } from "react";
import { 
  useGuardianStatus, 
  useGuardianAlerts, 
  useAnalyzeGuardian, 
  useAcknowledgeAlert, 
  useResolveAlert 
} from "@/hooks/useGuardian";
import { useAppStore } from "@/store/useAppStore";
import { AlertStatus, AlertSeverity, GuardianAlert } from "@/types/guardian";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  CheckCheck, 
  RefreshCw
} from "lucide-react";

export const GuardianView: React.FC = () => {
  const { setActivePage, setActiveTwinHandoff } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [selectedAlert, setSelectedAlert] = useState<GuardianAlert | null>(null);

  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
  } = useGuardianStatus();

  const {
    data: alerts,
    isLoading: isAlertsLoading,
    refetch: refetchAlerts,
  } = useGuardianAlerts(statusFilter === "ALL" ? undefined : statusFilter);

  const {
    mutate: runAnalysis,
    isPending: isAnalyzing,
    data: analysisResult,
  } = useAnalyzeGuardian();

  const {
    mutate: acknowledgeAlert,
    isPending: isAcknowledging,
  } = useAcknowledgeAlert();

  const {
    mutate: resolveAlert,
    isPending: isResolving,
  } = useResolveAlert();

  const handleOpenAlert = (alert: GuardianAlert) => {
    setSelectedAlert(alert);
  };

  const handleCloseDrawer = () => {
    setSelectedAlert(null);
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId, {
      onSuccess: (updated) => {
        setSelectedAlert(updated);
        refetchAlerts();
      },
    });
  };

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId, {
      onSuccess: (updated) => {
        setSelectedAlert(updated);
        refetchAlerts();
      },
    });
  };

  const handleHandoffToTwin = (alert: GuardianAlert) => {
    // Construct structured Twin handoff payload
    const handoffPayload = {
      handoff_id: `hnd_${alert.alert_id}`,
      source_alert_id: alert.alert_id,
      anomaly_type: alert.metric,
      target_entity: alert.metric.split("_")[0] || "general",
      baseline_rate: alert.baseline_value,
      observed_rate: alert.observed_value,
      delta: alert.absolute_delta,
      affected_order_count: alert.business_impact?.excess_failed_orders ?? 0,
      estimated_revenue_at_risk_inr: alert.business_impact?.estimated_revenue_at_risk_inr ?? 0,
      suggested_scenario_interventions: [
        {
          type: "ROUTING_SHIFT",
          target: "card",
          shift_percentage: 15.0,
          rationale: "Mitigate degraded UPI capture rate by shifting traffic toward cards",
        },
      ],
    };

    setActiveTwinHandoff(handoffPayload);
    setSelectedAlert(null);
    setActivePage("twin");
  };

  const severityBadgeVariant = (sev: AlertSeverity) => {
    switch (sev) {
      case "CRITICAL":
      case "HIGH":
        return "danger";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "info";
      default:
        return "neutral";
    }
  };

  const statusBadgeVariant = (st: AlertStatus) => {
    switch (st) {
      case "OPEN":
        return "danger";
      case "ACKNOWLEDGED":
        return "warning";
      case "RESOLVED":
      case "RECOVERED":
        return "success";
      default:
        return "neutral";
    }
  };

  if (isStatusLoading || isAlertsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isStatusError) {
    return (
      <ErrorAlert
        title="Failed to Load Payment Guardian"
        message={(statusError as Error)?.message || "Could not reach Guardian API endpoint."}
        onRetry={() => refetchStatus()}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Sentinel Health & Surveillance Control Banner */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status?.guardian_available ? "bg-twin-success animate-pulse" : "bg-twin-slate"
              }`}
            />
            <h2 className="text-base font-display font-bold text-twin-white tracking-tight">
              Payment Guardian Sentinel
            </h2>
            <Badge variant={status?.guardian_available ? "success" : "neutral"} size="sm">
              {status?.status.toUpperCase() || "STANDBY"}
            </Badge>
          </div>
          <p className="text-xs text-twin-slate">
            {status?.message || "Continuous telemetry drift surveillance over recent payment records."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs px-3 py-1.5 rounded-md bg-twin-card border border-twin-border font-mono text-twin-slate">
            BASELINE: <span className="text-twin-white font-semibold">{status?.baseline_sample_size ?? 0}</span> records
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={isAnalyzing}
            onClick={() => runAnalysis(undefined)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Run Drift Surveillance
          </Button>
        </div>
      </div>

      {/* Analysis Feedback Toast / Result if triggered */}
      {analysisResult && (
        <div className="p-4 rounded-xl border border-twin-cyan/30 bg-twin-cyan/10 text-xs font-mono text-twin-white flex items-center justify-between">
          <span>{analysisResult.message}</span>
          <span className="text-twin-cyan">
            Active Alerts: {analysisResult.active_alerts_count}
          </span>
        </div>
      )}

      {/* Alert Feed Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-twin-border/60 pb-3">
          <h3 className="text-sm font-display font-semibold text-twin-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-twin-cyan" />
            Telemetry Anomaly Alerts ({alerts?.length ?? 0})
          </h3>

          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
            <TabsList>
              <TabsTrigger value="ALL">ALL</TabsTrigger>
              <TabsTrigger value="OPEN">OPEN</TabsTrigger>
              <TabsTrigger value="ACKNOWLEDGED">ACKNOWLEDGED</TabsTrigger>
              <TabsTrigger value="RESOLVED">RESOLVED</TabsTrigger>
              <TabsTrigger value="RECOVERED">RECOVERED</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Alert Cards List */}
        {!alerts || alerts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Zero Anomaly Alerts in View"
            description="Payment telemetry is currently consistent with the merchant's empirical baseline. No statistically significant drift detected."
            statusBadge="ALL SYSTEMS NOMINAL"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.alert_id}
                onClick={() => handleOpenAlert(alert)}
                className="p-5 rounded-xl glass-panel glass-panel-hover border border-twin-border cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityBadgeVariant(alert.severity)} size="sm">
                      {alert.severity}
                    </Badge>
                    <Badge variant={statusBadgeVariant(alert.status)} size="sm">
                      {alert.status}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-twin-white">
                      {alert.metric.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-twin-slate">
                      • {alert.window_description}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-twin-slate">
                      Baseline: <strong className="text-twin-white">{(alert.baseline_value * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="text-twin-slate">
                      Observed: <strong className="text-twin-danger">{(alert.observed_value * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="text-twin-danger font-bold">
                      {alert.absolute_delta > 0 ? "+" : ""}{(alert.absolute_delta * 100).toFixed(1)}% Δ
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {alert.business_impact && (
                    <div className="text-right">
                      <span className="text-[10px] text-twin-slate uppercase block">Rev at Risk (Est)</span>
                      <span className="font-bold text-twin-warning">
                        ₹{alert.business_impact.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" className="group-hover:text-twin-cyan">
                    Inspect Evidence →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Alert Inspection Drawer */}
      <Drawer
        isOpen={!!selectedAlert}
        onClose={handleCloseDrawer}
        title={selectedAlert ? `Alert: ${selectedAlert.metric.replace(/_/g, " ").toUpperCase()}` : "Alert Detail"}
        description={selectedAlert?.window_description}
      >
        {selectedAlert && (
          <div className="space-y-6 text-xs font-mono">
            {/* Status & Severity Badges */}
            <div className="flex items-center gap-2">
              <Badge variant={severityBadgeVariant(selectedAlert.severity)} size="md">
                SEVERITY: {selectedAlert.severity}
              </Badge>
              <Badge variant={statusBadgeVariant(selectedAlert.status)} size="md">
                STATUS: {selectedAlert.status}
              </Badge>
            </div>

            {/* What Changed? */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                1. Metric Degradation Summary
              </span>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-twin-bg border border-twin-border">
                  <span className="text-[10px] text-twin-slate block">Baseline</span>
                  <span className="font-bold text-twin-white">{(selectedAlert.baseline_value * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded bg-twin-bg border border-twin-border">
                  <span className="text-[10px] text-twin-slate block">Observed</span>
                  <span className="font-bold text-twin-danger">{(selectedAlert.observed_value * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded bg-twin-bg border border-twin-border">
                  <span className="text-[10px] text-twin-slate block">Shift (Delta)</span>
                  <span className="font-bold text-twin-danger">{(selectedAlert.absolute_delta * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Statistical Evidence */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                2. Statistical Evidence & Dual Gate
              </span>
              <div className="space-y-1.5 text-[11px] text-twin-slate">
                <div className="flex justify-between">
                  <span>Detector Algorithm:</span>
                  <span className="text-twin-cyan font-semibold">{selectedAlert.detector}</span>
                </div>
                <div className="flex justify-between">
                  <span>Test Statistic:</span>
                  <span className="text-twin-white">{selectedAlert.test_statistic.toFixed(4)}</span>
                </div>
                {selectedAlert.p_value_adjusted_fdr != null && (
                  <div className="flex justify-between">
                    <span>FDR-Adjusted p-value:</span>
                    <span className="text-twin-white font-bold">
                      {selectedAlert.p_value_adjusted_fdr.toExponential(3)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Sample Window Count:</span>
                  <span className="text-twin-white">{selectedAlert.sample_size_recent} records</span>
                </div>
              </div>
            </div>

            {/* Business Impact Estimation */}
            {selectedAlert.business_impact && (
              <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
                <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                  3. Quantified Business Impact
                </span>
                <div className="space-y-1.5 text-[11px] text-twin-slate">
                  <div className="flex justify-between">
                    <span>Observed Failures:</span>
                    <span className="text-twin-danger font-bold">{selectedAlert.business_impact.observed_failed_orders} orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Excess Declines:</span>
                    <span className="text-twin-danger font-bold">{selectedAlert.business_impact.excess_failed_orders} orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Revenue at Risk:</span>
                    <span className="text-twin-warning font-bold">
                      ₹{selectedAlert.business_impact.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-twin-slate/70 pt-1 border-t border-twin-border/40 leading-normal">
                  Revenue at risk is an empirical statistical estimate based on baseline AOV and does not represent realized accounting loss.
                </p>
              </div>
            )}

            {/* Diagnostic Associations */}
            {selectedAlert.diagnostic_associations && selectedAlert.diagnostic_associations.length > 0 && (
              <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
                <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                  4. Diagnostic Associations (Empirical)
                </span>
                <div className="space-y-2 pt-1">
                  {selectedAlert.diagnostic_associations.map((assoc, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-twin-bg border border-twin-border space-y-1 text-[11px]">
                      <div className="flex justify-between text-twin-white font-bold">
                        <span>{assoc.entity_name} ({assoc.entity_type})</span>
                        <span className="text-twin-danger">{(assoc.relative_contribution_percent).toFixed(1)}% share</span>
                      </div>
                      <p className="text-[10px] text-twin-slate leading-relaxed">
                        {assoc.association_statement}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifecycle Actions */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                5. Actions & Counterfactual Exploration
              </span>

              <div className="flex items-center gap-2">
                {selectedAlert.status === "OPEN" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    isLoading={isAcknowledging}
                    onClick={() => handleAcknowledge(selectedAlert.alert_id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Acknowledge
                  </Button>
                )}

                {selectedAlert.status !== "RESOLVED" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    isLoading={isResolving}
                    onClick={() => handleResolve(selectedAlert.alert_id)}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Resolve
                  </Button>
                )}
              </div>

              {/* Hero CTA: Send Context to Twin */}
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleHandoffToTwin(selectedAlert)}
              >
                Send Context to Payment Twin →
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
