import React from "react";
import { GuardianAlert } from "@/types/guardian";

interface GuardianStatusRibbonProps {
  alerts: GuardianAlert[];
  baselineSampleSize: number;
  recentSampleSize?: number;
  lastAnalysisTimestamp?: string | null;
  reliabilityGrade?: string;
  totalDetectorCount?: number;
}

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

export const GuardianStatusRibbon: React.FC<GuardianStatusRibbonProps> = ({
  alerts,
  baselineSampleSize = 650,
  recentSampleSize = 200,
  lastAnalysisTimestamp,
  reliabilityGrade = "GRADE_A",
  totalDetectorCount = 10,
}) => {
  const openAlerts = alerts.filter((a) => a.status === "OPEN");
  const ackAlerts = alerts.filter((a) => a.status === "ACKNOWLEDGED");
  const resolvedAlerts = alerts.filter(
    (a) => a.status === "RESOLVED" || a.status === "RECOVERED"
  );
  const hasActiveAnomalies = openAlerts.length > 0;

  const formattedTime = lastAnalysisTimestamp
    ? new Date(lastAnalysisTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Live Standby";

  const items = [
    {
      label: "Surveillance status",
      value: hasActiveAnomalies ? "ATTENTION REQUIRED" : "ACTIVE & HEALTHY",
      detail: hasActiveAnomalies
        ? `${openAlerts.length} active anomaly alert(s)`
        : "All telemetry within 95% CI",
      isPositive: !hasActiveAnomalies,
      isWarning: hasActiveAnomalies,
    },
    {
      label: "Open findings",
      value: `${openAlerts.length} open`,
      detail: `${ackAlerts.length} ack · ${resolvedAlerts.length} resolved`,
      isPositive: openAlerts.length === 0,
      isWarning: openAlerts.length > 0,
    },
    {
      label: "Monitored battery",
      value: `${totalDetectorCount} drift tests`,
      detail: "PSI, Z-Test, Fisher, KS, CUSUM",
      isPositive: false,
    },
    {
      label: "Recent window",
      value: `${formatNumber(recentSampleSize)} orders`,
      detail: `Evaluated at ${formattedTime}`,
      isPositive: false,
    },
    {
      label: "Baseline calibrated",
      value: `${formatNumber(baselineSampleSize)} records`,
      detail: `${reliabilityGrade.replace(/_/g, " ")} · DNA v1.0.0`,
      isPositive: false,
    },
    {
      label: "FDR control (α)",
      value: "0.05 BH-FDR",
      detail: "Dual-gate false discovery control",
      isPositive: true,
    },
  ];

  return (
    <section
      aria-label="Payment Guardian Surveillance Status Summary"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-hairline">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 p-4 sm:p-5 space-y-1">
            <p className="text-[11px] text-textSecondary font-medium truncate">
              {item.label}
            </p>
            <p
              className={`text-base xl:text-lg font-mono font-bold tracking-tight tabular-nums leading-tight ${
                item.isWarning
                  ? "text-semantic-error"
                  : item.isPositive
                  ? "text-semantic-success"
                  : "text-textPrimary"
              }`}
            >
              {item.value}
            </p>
            <p className="text-[10px] text-textTertiary truncate">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
