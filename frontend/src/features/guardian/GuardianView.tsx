import React, { useState, useEffect, useRef } from "react";
import { 
  useGuardianStatus, 
  useGuardianAlerts, 
  useAnalyzeGuardian, 
  useAcknowledgeAlert, 
  useResolveAlert 
} from "@/hooks/useGuardian";
import { useAppStore } from "@/store/useAppStore";
import { AlertStatus, GuardianAlert, DetectorResult, GuardianTwinHandoff } from "@/types/guardian";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

import { GuardianHeader } from "./components/GuardianHeader";
import { GuardianAttentionStrip } from "./components/GuardianAttentionStrip";
import { AlertForensicsTable } from "./components/AlertForensicsTable";
import { StatisticalDetectorBattery } from "./components/StatisticalDetectorBattery";
import { AlertDetailDrawer } from "./components/AlertDetailDrawer";
import { GuardianTwinHandoffBanner } from "./components/GuardianTwinHandoffBanner";

export const GuardianView: React.FC = () => {
  const { setActivePage, setActiveTwinHandoff } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [selectedAlert, setSelectedAlert] = useState<GuardianAlert | null>(null);
  const detectorBatteryRef = useRef<HTMLDivElement | null>(null);

  // 1. Guardian Status Query
  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
  } = useGuardianStatus();

  // 2. Guardian Alerts Query
  const {
    data: alertsData,
    isLoading: isAlertsLoading,
    refetch: refetchAlerts,
  } = useGuardianAlerts(statusFilter === "ALL" ? undefined : statusFilter);

  // 3. Analyze Mutation (Drift Surveillance Battery)
  const {
    mutate: runAnalysis,
    isPending: isAnalyzing,
    data: analysisResult,
  } = useAnalyzeGuardian();

  // 4. Lifecycle Mutations
  const {
    mutate: acknowledgeAlert,
    isPending: isAcknowledging,
  } = useAcknowledgeAlert();

  const {
    mutate: resolveAlert,
    isPending: isResolving,
  } = useResolveAlert();

  // Auto-run analysis once on initial mount if available to populate the detector battery
  const hasAutoAnalyzed = useRef(false);
  useEffect(() => {
    if (!hasAutoAnalyzed.current) {
      hasAutoAnalyzed.current = true;
      runAnalysis(undefined);
    }
  }, [runAnalysis]);

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
        refetchStatus();
      },
    });
  };

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId, {
      onSuccess: (updated) => {
        setSelectedAlert(updated);
        refetchAlerts();
        refetchStatus();
      },
    });
  };

  const handleHandoffToTwin = (alert: GuardianAlert) => {
    const handoffPayload: GuardianTwinHandoff = {
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
          rationale: `Mitigate degraded ${alert.metric} by simulating counterfactual traffic re-routing in Payment Twin`,
        },
      ],
    };

    setActiveTwinHandoff(handoffPayload);
    setSelectedAlert(null);
    setActivePage("twin");
  };

  const scrollToDetectorBattery = () => {
    detectorBatteryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Combine alerts: prefer active alerts from analysis result if present, otherwise fetched alerts
  const combinedAlerts: GuardianAlert[] = alertsData || status?.open_alerts || [];
  const detectorResults: DetectorResult[] = analysisResult?.all_detector_results || [];

  if ((isStatusLoading && !status) || (isAlertsLoading && !alertsData && !status)) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto pb-12">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isStatusError) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <ErrorAlert
          title="Payment Guardian Surveillance Offline"
          message={(statusError as Error)?.message || "Could not connect to Payment Guardian backend service."}
          onRetry={() => {
            refetchStatus();
            refetchAlerts();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. OPERATIONAL PAGE HEADER */}
      <GuardianHeader
        guardianAvailable={status?.guardian_available ?? true}
        reliabilityGrade={status?.dna_reliability_grade}
        baselineSampleSize={status?.baseline_sample_size ?? 650}
        lastAnalysisTimestamp={analysisResult?.evaluated_at_iso || status?.last_analysis_timestamp}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={() => runAnalysis(undefined)}
      />

      {/* 2. SENTINEL ATTENTION & METRIC STRIP */}
      <GuardianAttentionStrip
        alerts={combinedAlerts}
        baselineSampleSize={status?.baseline_sample_size ?? 650}
        lastAnalysisTimestamp={analysisResult?.evaluated_at_iso || status?.last_analysis_timestamp}
        reliabilityGrade={status?.dna_reliability_grade}
      />

      {/* 3. PRIMARY SIGNAL & ANOMALY ALERT TABLE */}
      <AlertForensicsTable
        alerts={combinedAlerts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSelectAlert={handleOpenAlert}
        onViewDetectorBattery={scrollToDetectorBattery}
      />

      {/* 4. STATISTICAL DRIFT DETECTOR BATTERY (10 TESTS) */}
      <div ref={detectorBatteryRef}>
        <StatisticalDetectorBattery detectorResults={detectorResults} />
      </div>

      {/* 5. DOWNSTREAM PAYMENT TWIN SIMULATION BRIDGE */}
      <GuardianTwinHandoffBanner
        activeAlertsCount={combinedAlerts.length}
        onLaunchTwin={() => setActivePage("twin")}
      />

      {/* 6. SLIDE-OVER INVESTIGATION DRAWER */}
      <AlertDetailDrawer
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={handleCloseDrawer}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        onHandoffToTwin={handleHandoffToTwin}
        isAcknowledging={isAcknowledging}
        isResolving={isResolving}
      />
    </div>
  );
};
