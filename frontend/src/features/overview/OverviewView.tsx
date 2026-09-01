import React from "react";
import { KPIMetricCard } from "@/components/domain/KPIMetricCard";
import { DistributionBar, MethodShareItem } from "@/components/domain/DistributionBar";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useDatasetSummary, useIngestPayments, useLoadBenchmark } from "@/hooks/useDatasets";
import { useDNAStatus } from "@/hooks/useDNA";
import { useGuardianStatus } from "@/hooks/useGuardian";
import { useAppStore } from "@/store/useAppStore";
import { 
  RefreshCw, 
  Layers,
  PlayCircle,
  ShieldCheck,
  Sparkles 
} from "lucide-react";

export const OverviewView: React.FC = () => {
  const { setActivePage, setCurrentProvenance, setSystemHealth } = useAppStore();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useDatasetSummary();

  const { data: dnaStatus } = useDNAStatus();
  const { data: guardianStatus } = useGuardianStatus();

  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: isBenchmarkLoading } = useLoadBenchmark();

  // Synchronize store provenance and health when data loads
  React.useEffect(() => {
    if (dnaStatus && dnaStatus.profiling_available) {
      setCurrentProvenance(dnaStatus.provenance_type as any);
      setSystemHealth("healthy");
    } else if (summary && summary.total_records > 0) {
      setCurrentProvenance("OBSERVED_RAZORPAY_DATA");
      setSystemHealth("healthy");
    } else {
      setCurrentProvenance("UNAVAILABLE");
      setSystemHealth("unavailable");
    }
  }, [dnaStatus, summary, setCurrentProvenance, setSystemHealth]);

  const hasObservedData = summary && summary.total_records > 0;

  // Transform method distribution into items for DistributionBar
  const methodItems: MethodShareItem[] = React.useMemo(() => {
    if (!summary || !summary.method_distribution || summary.total_records === 0) return [];

    const total = summary.total_records;
    const colors: Record<string, string> = {
      upi: "#06B6D4",        // Cyan
      card: "#6366F1",       // Indigo
      netbanking: "#F59E0B", // Amber
      wallet: "#10B981",     // Emerald
      emi: "#EC4899",        // Pink
    };

    return Object.entries(summary.method_distribution).map(([method, count]) => ({
      key: method,
      label: method.toUpperCase(),
      percentage: (count / total) * 100,
      color: colors[method.toLowerCase()] || "#94A3B8",
    }));
  }, [summary]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Topline Intelligence Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSummaryLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : isSummaryError ? (
          <div className="col-span-full">
            <ErrorAlert
              title="Unable to load summary"
              message={(summaryError as Error)?.message || "Failed to reach backend API"}
              onRetry={() => refetchSummary()}
            />
          </div>
        ) : (
          <>
            <KPIMetricCard
              title="Observed Telemetry Records"
              value={hasObservedData ? summary?.total_records : null}
              unit="records"
              decimals={0}
              isUnavailable={!hasObservedData}
              tooltipText="Total sanitized payment records ingested from merchant Razorpay Test Mode account."
            />
            <KPIMetricCard
              title="Overall Capture Rate"
              value={hasObservedData ? summary?.status_metrics?.success_rate_percent : null}
              unit="%"
              decimals={1}
              isUnavailable={!hasObservedData}
              tooltipText="Percentage of initiated payment attempts successfully captured."
            />
            <KPIMetricCard
              title="Average Ticket Size (AOV)"
              value={hasObservedData ? summary?.financial_metrics?.average_amount_inr : null}
              unit="INR"
              decimals={2}
              isUnavailable={!hasObservedData}
              tooltipText="Arithmetic mean transaction ticket size across valid records."
            />
            <KPIMetricCard
              title="Payment Failure Rate"
              value={hasObservedData ? summary?.status_metrics?.failure_rate_percent : null}
              unit="%"
              decimals={1}
              isUnavailable={!hasObservedData}
              tooltipText="Percentage of payment attempts terminating in failure."
            />
          </>
        )}
      </div>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Behavioral Snapshot or Onboarding Setup */}
        <div className="lg:col-span-2 space-y-6">
          {hasObservedData ? (
            <Card variant="primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-twin-cyan" />
                    Observed Payment Instrument Mix
                  </CardTitle>
                  <CardDescription>
                    Empirical payment method distribution across {summary?.total_records.toLocaleString()} records
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActivePage("dna")}>
                  Full DNA Profile →
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <DistributionBar items={methodItems} />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                    <span className="text-twin-slate">Gross Volume:</span>
                    <div className="text-sm font-bold text-twin-white">
                      ₹{summary?.financial_metrics?.total_amount_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                    <span className="text-twin-slate">Captured Orders:</span>
                    <div className="text-sm font-bold text-twin-success">
                      {summary?.status_metrics?.captured_count.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                    <span className="text-twin-slate">Failed Orders:</span>
                    <div className="text-sm font-bold text-twin-danger">
                      {summary?.status_metrics?.failed_count.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card variant="primary" className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    Observed Telemetry Required
                  </CardTitle>
                  <CardDescription>
                    Payment Twin is connected to Razorpay Test Mode. Ingest payments to establish your baseline.
                  </CardDescription>
                </div>
                <div className="text-xs font-mono px-2.5 py-1 rounded bg-twin-card border border-twin-border text-twin-slate">
                  AWAITING INGESTION
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-twin-card/40 border border-twin-border/60 space-y-2">
                  <div className="flex items-center gap-2 text-twin-cyan font-mono text-xs">
                    <span className="w-5 h-5 rounded-full bg-twin-cyan/15 flex items-center justify-center font-bold">1</span>
                    <span>Ingest Data</span>
                  </div>
                  <p className="text-[11px] text-twin-slate">
                    Sync sanitized payment records from Razorpay Test Mode.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-twin-card/40 border border-twin-border/60 space-y-2">
                  <div className="flex items-center gap-2 text-twin-indigo font-mono text-xs">
                    <span className="w-5 h-5 rounded-full bg-twin-indigo/15 flex items-center justify-center font-bold">2</span>
                    <span>Profile DNA</span>
                  </div>
                  <p className="text-[11px] text-twin-slate">
                    Extract empirical priors and failure diagnostics.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-twin-card/40 border border-twin-border/60 space-y-2">
                  <div className="flex items-center gap-2 text-twin-success font-mono text-xs">
                    <span className="w-5 h-5 rounded-full bg-twin-success/15 flex items-center justify-center font-bold">3</span>
                    <span>Simulate & Protect</span>
                  </div>
                  <p className="text-[11px] text-twin-slate">
                    Run What-If scenarios & activate Guardian Sentinel.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isIngesting}
                  onClick={() => triggerIngest({ count: 100 })}
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Test Payments
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isBenchmarkLoading}
                  onClick={() => loadBenchmark()}
                >
                  <Sparkles className="w-4 h-4 text-twin-warning" />
                  Load Synthetic Benchmark (650 Records)
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActivePage("settings")}>
                  Manage Datasets →
                </Button>
              </div>
            </Card>
          )}

          {/* Simulation Readiness Banner */}
          <Card variant="secondary" className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-twin-indigo" />
                <h4 className="text-xs font-semibold text-twin-white">
                  Payment Twin Simulation Readiness
                </h4>
                {dnaStatus && (
                  <ConfidenceGrade
                    grade={dnaStatus.confidence_grade as any}
                    sampleSize={dnaStatus.available_sample_count}
                  />
                )}
              </div>
              <p className="text-[11px] text-twin-slate">
                {dnaStatus?.profiling_available
                  ? `Baseline calibrated with ${dnaStatus.available_sample_count} records. Ready to explore What-If counterfactuals.`
                  : "Requires observed payment records to generate synthetic Customer Agent populations."}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!dnaStatus?.profiling_available}
              onClick={() => setActivePage("twin")}
            >
              Open Simulator →
            </Button>
          </Card>
        </div>

        {/* Right Col: Guardian Sentinel Status Panel */}
        <div className="space-y-6">
          <Card variant="primary" className="p-6 flex flex-col justify-between space-y-6 h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-twin-border/60 pb-3">
                <span className="text-xs font-mono text-twin-slate uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-twin-cyan" />
                  Guardian Sentinel
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-card border border-twin-border text-twin-cyan">
                  {guardianStatus?.guardian_available ? "ACTIVE" : "STANDBY"}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-display font-semibold text-twin-white">
                  Statistical Drift Surveillance
                </h3>
                <p className="text-xs text-twin-slate leading-relaxed">
                  Monitors telemetry shifts in capture rates, bank decline surges, and error reasons using FDR-controlled tests.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-twin-card/50 border border-twin-border/60 text-xs font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">Active Anomaly Alerts:</span>
                  <span className="text-sm font-bold text-twin-white">
                    {guardianStatus?.active_alerts_count ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">Baseline Sample:</span>
                  <span className="text-twin-white">
                    {guardianStatus?.baseline_sample_size ?? 0} records
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">Drift Gate:</span>
                  <span className="text-twin-cyan">Dual Significance</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setActivePage("guardian")}
            >
              Open Sentinel Cockpit →
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
