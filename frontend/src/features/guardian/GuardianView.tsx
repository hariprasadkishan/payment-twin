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
import { Button } from "@/components/ui/Button";

import { GuardianStatusRibbon } from "./components/GuardianStatusRibbon";
import { GuardianDeviationSurface } from "./components/GuardianDeviationSurface";
import { GuardianFindingQueue } from "./components/GuardianFindingQueue";
import { GuardianStatisticalEvidence } from "./components/GuardianStatisticalEvidence";
import { AlertDetailDrawer } from "./components/AlertDetailDrawer";
import { 
  RotateCw, 
  Sparkles, 
  ArrowRight,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

export const GuardianView: React.FC = () => {
  const { setActivePage, setActiveTwinHandoff } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [selectedAlert, setSelectedAlert] = useState<GuardianAlert | null>(null);

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

  // Combine alerts: prefer active alerts from analysis result if present, otherwise fetched alerts
  const combinedAlerts: GuardianAlert[] = alertsData || status?.open_alerts || [];
  const detectorResults: DetectorResult[] = analysisResult?.all_detector_results || [];

  if ((isStatusLoading && !status) || (isAlertsLoading && !alertsData && !status)) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto pb-16">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isStatusError) {
    return (
      <div className="max-w-7xl mx-auto py-12">
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. COMPACT OPERATIONAL HEADER (LEDGERIX CLARITY)                          */}
      {/* ========================================================================= */}
      <div className="space-y-2 border-b border-hairline pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
                PAYMENT GUARDIAN · STATISTICAL SURVEILLANCE
              </span>
              <span className="text-textTertiary text-xs">•</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
                Baseline: {status?.baseline_sample_size ?? 650} records (Grade A)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
              Payment Guardian
            </h1>
            <p className="text-xs text-textSecondary max-w-3xl leading-relaxed">
              Statistical surveillance monitoring meaningful deviations from the merchant’s learned payment behaviour. Evaluates conversion stability, rail shift, and issuer anomalies using dual-gate FDR testing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => runAnalysis(undefined)}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-hairline bg-surface hover:bg-canvas text-textSecondary hover:text-textPrimary transition-colors shadow-xs"
            >
              <RotateCw className={cn("size-3.5", isAnalyzing ? "animate-spin text-accent" : "text-textTertiary")} />
              <span>{isAnalyzing ? "Analyzing Telemetry..." : "Run Surveillance Battery"}</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setActivePage("twin")}
              className="whitespace-nowrap shadow-sm text-xs font-medium"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              <span>Open Payment Twin</span>
            </Button>
          </div>
        </div>

        {/* Statistical Honesty Disclaimer */}
        <div className="text-[11px] text-textTertiary bg-canvas/50 border border-hairline/60 rounded px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
          <span>
            {analysisResult?.provenance_disclaimer ||
              "Payment Guardian drift detection and impact estimations are statistical diagnostics and do not constitute financial guarantees or causal proof."}
          </span>
          <span className="font-mono text-[10px] text-textSecondary">
            Recent Window: {analysisResult?.recent_sample_count ?? 200} tx · Dual-Gate FDR α=0.05
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GUARDIAN STATUS STRIP (CONTINUOUS MONITORING SUMMARY)                  */}
      {/* ========================================================================= */}
      <GuardianStatusRibbon
        alerts={combinedAlerts}
        baselineSampleSize={status?.baseline_sample_size ?? 650}
        recentSampleSize={analysisResult?.recent_sample_count ?? 200}
        lastAnalysisTimestamp={analysisResult?.evaluated_at_iso || status?.last_analysis_timestamp}
        reliabilityGrade={status?.dna_reliability_grade}
        totalDetectorCount={detectorResults.length || 10}
      />

      {/* ========================================================================= */}
      {/* 3. DOMINANT ANALYTICAL SURFACE: DEVIATION MONITOR                         */}
      {/* ========================================================================= */}
      <GuardianDeviationSurface
        detectorResults={detectorResults}
        onSelectDetector={(det) => {
          // If a corresponding alert exists for this detector, open it
          const matchingAlert = combinedAlerts.find((a) => a.metric === det.metric_name);
          if (matchingAlert) {
            handleOpenAlert(matchingAlert);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 4. INCIDENT & INVESTIGATION QUEUE                                         */}
      {/* ========================================================================= */}
      <GuardianFindingQueue
        alerts={combinedAlerts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSelectAlert={handleOpenAlert}
        onRunAnalysis={() => runAnalysis(undefined)}
        isAnalyzing={isAnalyzing}
      />

      {/* ========================================================================= */}
      {/* 5. SURVEILLANCE METHODOLOGY & DUAL-GATE CRITERIA                          */}
      {/* ========================================================================= */}
      <GuardianStatisticalEvidence />

      {/* ========================================================================= */}
      {/* 6. DOWNSTREAM PAYMENT TWIN SIMULATION BRIDGE                              */}
      {/* ========================================================================= */}
      <section className="rounded-lg border border-hairline bg-surface p-5 shadow-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
              Investigate Deviations in Payment Twin
            </h3>
            <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Counterfactual Sandbox
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed">
            Guardian identifies when payment behaviour changes from baseline. Payment Twin simulates how smart routing, fallback rails, and retry parameter changes mitigate observed drops.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setActivePage("twin")}
          className="whitespace-nowrap self-start sm:self-center shadow-sm text-xs font-medium"
        >
          <span>Investigate in Payment Twin</span>
          <ArrowRight className="size-3.5 ml-1.5" />
        </Button>
      </section>

      {/* ========================================================================= */}
      {/* 7. SLIDE-OVER INVESTIGATION DRAWER                                        */}
      {/* ========================================================================= */}
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
