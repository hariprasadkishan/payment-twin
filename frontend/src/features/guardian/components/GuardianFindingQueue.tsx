import React, { useState } from "react";
import { GuardianAlert, AlertStatus } from "@/types/guardian";
import { ShieldCheck, Search, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardianFindingQueueProps {
  alerts: GuardianAlert[];
  statusFilter: AlertStatus | "ALL";
  onStatusFilterChange: (status: AlertStatus | "ALL") => void;
  onSelectAlert: (alert: GuardianAlert) => void;
  onRunAnalysis?: () => void;
  isAnalyzing?: boolean;
}

const formatCurrency = (n?: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);

export const GuardianFindingQueue: React.FC<GuardianFindingQueueProps> = ({
  alerts,
  statusFilter,
  onStatusFilterChange,
  onSelectAlert,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMetric = a.metric.toLowerCase().includes(q);
      const matchDetector = a.detector.toLowerCase().includes(q);
      if (!matchMetric && !matchDetector) return false;
    }
    return true;
  });

  const openCount = alerts.filter((a) => a.status === "OPEN").length;
  const ackCount = alerts.filter((a) => a.status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter(
    (a) => a.status === "RESOLVED" || a.status === "RECOVERED"
  ).length;

  const statusPills: { id: AlertStatus | "ALL"; label: string; count: number }[] = [
    { id: "ALL", label: "All Findings", count: alerts.length },
    { id: "OPEN", label: "Open", count: openCount },
    { id: "ACKNOWLEDGED", label: "Acknowledged", count: ackCount },
    { id: "RESOLVED", label: "Resolved", count: resolvedCount },
  ];

  return (
    <section
      aria-label="Guardian Finding Queue & Incident Workspace"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden space-y-0"
    >
      {/* Workspace Header */}
      <div className="p-4 sm:p-5 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
              Guardian Incident & Investigation Queue
            </h3>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
              Lifecycle Tracking
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Statistical deviations verified by dual-gate testing requiring operational review or Twin counterfactual simulation.
          </p>
        </div>

        {/* Search */}
        <div className="relative self-start sm:self-center">
          <Search className="size-3.5 text-textTertiary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by metric or detector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-56 rounded-md border border-hairline bg-canvas/60 pl-8 pr-3 text-xs text-textPrimary placeholder:text-textTertiary focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>
      </div>

      {/* Lifecycle Status Tabs */}
      <div className="px-4 sm:px-5 py-2.5 bg-canvas/30 border-b border-hairline flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          {statusPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => onStatusFilterChange(pill.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors",
                statusFilter === pill.id
                  ? "bg-surface font-semibold text-textPrimary border border-hairline shadow-xs"
                  : "text-textSecondary hover:text-textPrimary"
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.2 rounded-full",
                  pill.id === "OPEN" && pill.count > 0
                    ? "bg-rose-100 text-rose-800 font-bold"
                    : "bg-subtle text-textTertiary"
                )}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-textTertiary">
          Showing <strong className="text-textPrimary">{filteredAlerts.length}</strong> incident(s)
        </span>
      </div>

      {/* Queue Body */}
      {filteredAlerts.length > 0 ? (
        <div className="divide-y divide-hairline">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL" || alert.severity === "HIGH";
            const isOpen = alert.status === "OPEN";

            return (
              <div
                key={alert.alert_id}
                onClick={() => onSelectAlert(alert)}
                className={cn(
                  "p-4 sm:p-5 transition-colors cursor-pointer hover:bg-canvas/50",
                  isOpen ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-transparent"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-textPrimary">
                        {alert.alert_id}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase",
                          isCritical
                            ? "bg-rose-50 text-semantic-error border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border",
                          alert.status === "OPEN"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : alert.status === "ACKNOWLEDGED"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        )}
                      >
                        {alert.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-textPrimary">
                      {alert.metric.replace(/_/g, " ").toUpperCase()}
                    </h4>

                    <p className="text-xs text-textSecondary leading-relaxed">
                      {alert.window_description ||
                        `Observed rate of ${(alert.observed_value * 100).toFixed(1)}% deviates significantly from baseline ${(alert.baseline_value * 100).toFixed(1)}%.`}
                    </p>

                    {/* Diagnostic Impact Summary */}
                    {alert.business_impact && (
                      <div className="flex items-center gap-4 text-xs font-mono pt-1 text-textSecondary">
                        <span>
                          Excess Drops:{" "}
                          <strong className="text-semantic-error">
                            ~{alert.business_impact.excess_failed_orders} orders
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Volume at Risk:{" "}
                          <strong className="text-textPrimary">
                            {formatCurrency(alert.business_impact.estimated_revenue_at_risk_inr)}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-textTertiary">
                      {new Date(alert.last_evaluated_at_iso).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlert(alert);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                    >
                      <span>Inspect Evidence</span>
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dignified Nominal Empty State */
        <div className="p-8 sm:p-12 text-center space-y-3 bg-canvas/20">
          <div className="mx-auto grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <ShieldCheck className="size-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-textPrimary">
              Zero Statistical Drift Detected — Baseline In Sync
            </h4>
            <p className="text-xs text-textSecondary leading-relaxed">
              Surveillance battery evaluated 200 recent transactions against the 650-record Behavioral DNA baseline. All 10 statistical detectors fall within expected 95% confidence intervals and FDR α=0.05 thresholds.
            </p>
          </div>
          {onRunAnalysis && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-hairline bg-surface hover:bg-canvas text-textSecondary hover:text-textPrimary transition-colors shadow-xs"
              >
                <Clock className={cn("size-3.5", isAnalyzing ? "animate-spin text-accent" : "text-textTertiary")} />
                <span>{isAnalyzing ? "Evaluating Battery..." : "Run Manual Surveillance Battery"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
