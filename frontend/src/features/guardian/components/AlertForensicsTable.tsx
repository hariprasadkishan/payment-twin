import React, { useState, useMemo } from "react";
import { GuardianAlert, AlertStatus, AlertSeverity } from "@/types/guardian";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Search, ShieldAlert, ShieldCheck, ChevronRight, SlidersHorizontal, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertForensicsTableProps {
  alerts: GuardianAlert[];
  statusFilter: AlertStatus | "ALL";
  onStatusFilterChange: (status: AlertStatus | "ALL") => void;
  onSelectAlert: (alert: GuardianAlert) => void;
  onViewDetectorBattery?: () => void;
}

export const AlertForensicsTable: React.FC<AlertForensicsTableProps> = ({
  alerts,
  statusFilter,
  onStatusFilterChange,
  onSelectAlert,
  onViewDetectorBattery,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMetric = a.metric.toLowerCase().includes(q);
        const matchDetector = a.detector.toLowerCase().includes(q);
        const matchWindow = a.window_description.toLowerCase().includes(q);
        if (!matchMetric && !matchDetector && !matchWindow) return false;
      }
      return true;
    });
  }, [alerts, statusFilter, searchQuery]);

  const countsByStatus = useMemo(() => {
    return {
      ALL: alerts.length,
      OPEN: alerts.filter((a) => a.status === "OPEN").length,
      ACKNOWLEDGED: alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
      RESOLVED: alerts.filter((a) => a.status === "RESOLVED").length,
      RECOVERED: alerts.filter((a) => a.status === "RECOVERED").length,
    };
  }, [alerts]);

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-3.5 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Telemetry Anomaly Alerts
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Tracked ({alerts.length})
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Active and resolved drift anomalies where empirical payment telemetry breached dual significance thresholds.
          </p>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="size-3.5 text-textTertiary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search signal or detector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 rounded-md border border-hairline bg-canvas/60 pl-8 pr-2.5 text-xs text-textPrimary placeholder:text-textTertiary focus:bg-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={(val) => onStatusFilterChange(val as any)}>
            <TabsList>
              <TabsTrigger value="ALL">ALL ({countsByStatus.ALL})</TabsTrigger>
              <TabsTrigger value="OPEN">OPEN ({countsByStatus.OPEN})</TabsTrigger>
              <TabsTrigger value="ACKNOWLEDGED">ACK ({countsByStatus.ACKNOWLEDGED})</TabsTrigger>
              <TabsTrigger value="RESOLVED">RESOLVED ({countsByStatus.RESOLVED})</TabsTrigger>
              <TabsTrigger value="RECOVERED">REC ({countsByStatus.RECOVERED})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Counter and Active Filter Ribbon */}
      <div className="flex items-center justify-between text-xs text-textTertiary pb-0.5">
        <span>
          Showing <strong className="text-textPrimary font-semibold tabular-nums">{filteredAlerts.length}</strong> of {alerts.length} signals
        </span>
        {statusFilter !== "ALL" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
            <SlidersHorizontal className="size-3" />
            <span>Filtered by: {statusFilter}</span>
          </span>
        )}
      </div>

      {/* Table Surface */}
      {filteredAlerts.length === 0 ? (
        <div className="p-8 rounded-md border border-dashed border-hairline bg-canvas/40 text-center space-y-2.5">
          <div className="inline-flex p-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            <ShieldCheck className="size-5" strokeWidth={1.75} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-xs font-semibold text-textPrimary">
              {statusFilter === "ALL" ? "Zero Anomaly Alerts Detected" : `No Alerts in "${statusFilter}" State`}
            </h4>
            <p className="text-[11px] text-textSecondary leading-relaxed">
              {statusFilter === "ALL"
                ? "Recent payment telemetry is consistent with Behavioral DNA baseline priors. All 10 statistical drift tests are within designated tolerance thresholds."
                : `There are currently no tracked signals with status "${statusFilter}".`}
            </p>
          </div>
          {onViewDetectorBattery && (
            <Button variant="secondary" size="sm" onClick={onViewDetectorBattery} className="text-xs">
              Inspect 10 Statistical Drift Detectors ↓
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-canvas/50">
                <TableHead className="w-52">Signal / Metric</TableHead>
                <TableHead className="w-36">Detector</TableHead>
                <TableHead className="text-right">Baseline</TableHead>
                <TableHead className="text-right">Observed</TableHead>
                <TableHead className="text-right">Shift (Δ)</TableHead>
                <TableHead className="text-right">Evidence</TableHead>
                <TableHead className="text-right">Est. Rev at Risk</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-20 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => {
                const isDegraded = alert.observed_value < alert.baseline_value;
                const formattedDelta = `${(alert.absolute_delta * 100).toFixed(1)}%`;
                const revAtRisk = alert.business_impact?.estimated_revenue_at_risk_inr;

                return (
                  <TableRow
                    key={alert.alert_id}
                    onClick={() => onSelectAlert(alert)}
                    className="cursor-pointer hover:bg-subtle/50 transition-colors group"
                  >
                    {/* Signal / Metric */}
                    <TableCell className="font-medium text-textPrimary py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-textPrimary">
                            {alert.metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          <Badge variant={severityBadgeVariant(alert.severity)} size="sm">
                            {alert.severity}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-textTertiary block">
                          {alert.window_description}
                        </span>
                      </div>
                    </TableCell>

                    {/* Detector */}
                    <TableCell className="text-xs text-textSecondary font-mono py-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-subtle border border-hairline text-[10px]">
                        {alert.detector}
                      </span>
                    </TableCell>

                    {/* Baseline */}
                    <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-3">
                      {(alert.baseline_value * 100).toFixed(1)}%
                    </TableCell>

                    {/* Observed */}
                    <TableCell className="text-right text-xs font-mono tabular-nums font-semibold py-3">
                      <span className={cn(isDegraded ? "text-red-700" : "text-emerald-700")}>
                        {(alert.observed_value * 100).toFixed(1)}%
                      </span>
                    </TableCell>

                    {/* Shift (Delta) */}
                    <TableCell className="text-right text-xs font-mono tabular-nums py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[11px]",
                          isDegraded
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        )}
                      >
                        {isDegraded ? (
                          <ArrowDownRight className="size-3" />
                        ) : (
                          <ArrowUpRight className="size-3" />
                        )}
                        {formattedDelta}
                      </span>
                    </TableCell>

                    {/* Statistical Evidence */}
                    <TableCell className="text-right text-xs font-mono tabular-nums text-textTertiary py-3">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-textSecondary block">
                          Z: {alert.test_statistic.toFixed(2)}
                        </span>
                        {alert.p_value_adjusted_fdr !== null && alert.p_value_adjusted_fdr !== undefined ? (
                          <span className="text-[10px] text-accent font-medium block">
                            q: {alert.p_value_adjusted_fdr.toExponential(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-textTertiary block">CUSUM/PSI</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Business Impact */}
                    <TableCell className="text-right text-xs font-mono tabular-nums py-3">
                      {revAtRisk !== undefined && revAtRisk > 0 ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-amber-700 block">
                            ₹{revAtRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-[9px] text-textTertiary uppercase tracking-wider block">
                            Est. at Risk
                          </span>
                        </div>
                      ) : (
                        <span className="text-textTertiary">—</span>
                      )}
                    </TableCell>

                    {/* Lifecycle Status */}
                    <TableCell className="text-center py-3">
                      <Badge variant={statusBadgeVariant(alert.status)} size="sm" dot>
                        {alert.status}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlert(alert);
                        }}
                        className="text-xs group-hover:text-accent p-1 h-7"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="size-3 ml-0.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};
