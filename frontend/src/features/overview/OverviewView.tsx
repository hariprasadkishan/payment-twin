import React from "react";
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  Database,
  FlaskConical,
  Gauge,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDatasetSummary, useIngestPayments, useLoadBenchmark } from "@/hooks/useDatasets";
import { useDNAStatus } from "@/hooks/useDNA";
import { useGuardianStatus } from "@/hooks/useGuardian";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { OverviewPerformanceChart } from "./components/OverviewPerformanceChart";

const formatMoney = (value?: number | null) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

const formatNumber = (value?: number | null) =>
  value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);

export const OverviewView: React.FC = () => {
  const { setActivePage } = useAppStore();
  const { data: summary, isLoading: summaryLoading, isError: summaryError, error, refetch } =
    useDatasetSummary();
  const { data: dnaStatus, isLoading: dnaLoading } = useDNAStatus();
  const { data: guardianStatus } = useGuardianStatus();
  const { mutate: ingestPayments, isPending: ingesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: loadingBenchmark } = useLoadBenchmark();

  const loading = summaryLoading && dnaLoading;
  const hasData = Boolean(
    dnaStatus?.profiling_available || (summary?.total_records && summary.total_records > 0)
  );
  const total = summary?.total_records ?? 0;
  const status = summary?.status_metrics;
  const financial = summary?.financial_metrics;
  const isBenchmark = dnaStatus?.provenance_type === "SYNTHETIC_BENCHMARK_DATA";
  const sampleCount = dnaStatus?.available_sample_count || total;

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-16 w-1/3 rounded-md" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-48 rounded-lg lg:col-span-6" />
          <Skeleton className="h-48 rounded-lg lg:col-span-6" />
        </div>
      </div>
    );
  }

  if (summaryError && !dnaStatus) {
    return (
      <ErrorAlert
        title="Payment data is unavailable"
        message={(error as Error)?.message || "The payment summary could not be loaded."}
        onRetry={() => refetch()}
      />
    );
  }

  const metricRibbonItems = [
    {
      label: "Payment attempts",
      value: formatNumber(total),
      detail: hasData ? `${formatNumber(sampleCount)} records analyzed` : "No data loaded",
    },
    {
      label: "Captured payments",
      value: formatNumber(status?.captured_count),
      detail: status ? `${formatNumber(status.failed_count)} failed attempts` : "Awaiting data",
    },
    {
      label: "Capture rate",
      value: status ? `${status.success_rate_percent.toFixed(1)}%` : "—",
      detail: status ? `${status.failure_rate_percent.toFixed(1)}% failure rate` : "Awaiting data",
      isPositive: true,
    },
    {
      label: "Gross payment volume",
      value: formatMoney(financial?.total_amount_inr),
      detail: financial ? `${formatMoney(financial.total_fee_inr)} in fees` : "Awaiting data",
    },
    {
      label: "Average ticket",
      value: formatMoney(financial?.average_amount_inr),
      detail: financial ? `Median ${formatMoney(financial.median_amount_inr)}` : "Awaiting data",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. COMPACT PAGE HEADER */}
      <section className="flex flex-col justify-between gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-textTertiary font-semibold">
            Payment Intelligence
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-textPrimary">
            Overview
          </h1>
          <p className="mt-1 text-xs text-textSecondary max-w-2xl leading-relaxed">
            A concise view of payment performance, empirical baseline metrics, and decision pathways.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => setActivePage("dna")}>
            <ChartNoAxesCombined className="size-3.5" />
            <span>View Behavioral DNA</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActivePage("twin")}>
            <Sparkles className="size-3.5" />
            <span>Open Payment Twin</span>
          </Button>
        </div>
      </section>

      {/* EMPTY STATE IF NO DATA AVAILABLE */}
      {!hasData ? (
        <section className="rounded-lg border border-hairline bg-surface p-8 sm:p-10 shadow-panel">
          <div className="max-w-2xl space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
              Data Calibration Needed
            </span>
            <h2 className="text-xl font-bold tracking-tight text-textPrimary">
              Start with a calibrated payment dataset
            </h2>
            <p className="text-xs text-textSecondary leading-relaxed">
              Load the synthetic benchmark dataset to immediately explore the entire intelligence and
              simulation workspace, or connect your Razorpay Test Key in Settings to calibrate from live test records.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <Button isLoading={loadingBenchmark} onClick={() => loadBenchmark()}>
                <FlaskConical className="size-3.5" />
                <span>Load benchmark dataset</span>
              </Button>
              <Button
                variant="secondary"
                isLoading={ingesting}
                onClick={() => ingestPayments({ count: 100 })}
              >
                <RefreshCw className="size-3.5" />
                <span>Sync test payments</span>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* 2. PRIMARY FINANCIAL FOCUS (LEDGERIX-STYLE UNBOXED HEADLINE) */}
          <section className="space-y-1.5 pt-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-textTertiary font-semibold">
              Captured Payment Volume
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
                {formatMoney(financial?.total_amount_inr)}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center font-mono font-semibold text-semantic-success tabular-nums">
                  {status ? `${status.success_rate_percent.toFixed(1)}%` : "—"} Capture Rate
                </span>
                <span className="text-textTertiary">·</span>
                <span className="text-textSecondary">
                  {formatNumber(status?.captured_count)} of {formatNumber(total)} attempts
                </span>
                {financial?.total_fee_inr ? (
                  <>
                    <span className="text-textTertiary">·</span>
                    <span className="text-textSecondary">
                      {formatMoney(financial.total_fee_inr)} gateway fees
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          {/* 3. CONTINUOUS METRIC RIBBON (LEDGERIX-INSPIRED SINGLE INSTRUMENT) */}
          <section
            aria-label="Payment telemetry metric ribbon"
            className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-hairline">
              {metricRibbonItems.map((metric) => (
                <div key={metric.label} className="min-w-0 p-4 sm:p-5 space-y-1">
                  <p className="text-[11px] text-textSecondary font-medium">
                    {metric.label}
                  </p>
                  <p
                    className={`text-xl font-mono font-bold tracking-tight tabular-nums truncate ${
                      metric.isPositive ? "text-semantic-success" : "text-textPrimary"
                    }`}
                  >
                    {metric.value}
                  </p>
                  <p className="text-[10px] text-textTertiary truncate">
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. DOMINANT ANALYTICAL SURFACE (ONE PRIMARY VISUALIZATION) */}
          <section aria-label="Payment Performance Analytical Surface">
            <OverviewPerformanceChart
              summary={summary}
              totalRecords={total}
              onExploreDNA={() => setActivePage("dna")}
            />
          </section>

          {/* 5. SECONDARY INFORMATION: GUARDIAN SENTRY + NEXT DECISION PATHWAYS */}
          <section className="grid gap-6 lg:grid-cols-12">
            {/* Left: Payment Guardian Sentinel Attention */}
            <div className="rounded-lg border border-hairline bg-surface shadow-panel flex flex-col lg:col-span-5">
              <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold tracking-tight text-textPrimary flex items-center gap-2">
                    <ShieldAlert className="size-4 text-accent" />
                    <span>Guardian Attention</span>
                  </h2>
                  <p className="text-xs text-textSecondary">
                    Statistical deviations that may require investigation.
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                    guardianStatus?.guardian_available
                      ? "bg-emerald-50 text-semantic-success border-emerald-200"
                      : "bg-subtle text-textSecondary border-hairline"
                  }`}
                >
                  {guardianStatus?.guardian_available ? "Active Sentinel" : "Idle"}
                </span>
              </div>

              <div className="flex-1 p-6 space-y-4">
                {guardianStatus?.guardian_available ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold tracking-tight text-textPrimary tabular-nums">
                        {guardianStatus.active_alerts_count}
                      </span>
                      <span className="text-xs font-medium text-textSecondary">
                        active {guardianStatus.active_alerts_count === 1 ? "alert" : "alerts"} detected
                      </span>
                    </div>

                    <p className="text-xs text-textSecondary leading-relaxed border-t border-hairline pt-3">
                      Calibrated baseline:{" "}
                      <span className="font-mono font-semibold text-textPrimary">
                        {formatNumber(guardianStatus.baseline_sample_size)}
                      </span>{" "}
                      payments. Guardian identifies statistical drift; it does not establish causality.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-textSecondary leading-relaxed">
                    Guardian sentinel activates after Behavioral DNA empirical priors are generated.
                  </p>
                )}
              </div>

              <div className="border-t border-hairline px-6 py-3.5 bg-canvas/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => setActivePage("guardian")}
                >
                  <ShieldAlert className="size-3.5" />
                  <span>Review Guardian Sentinel</span>
                </Button>
              </div>
            </div>

            {/* Right: Operational Next Actions & Decision Pathways */}
            <div className="rounded-lg border border-hairline bg-surface shadow-panel flex flex-col lg:col-span-7">
              <div className="border-b border-hairline px-6 py-4">
                <h2 className="text-sm font-semibold tracking-tight text-textPrimary">
                  Next Actions & Intelligence Pathways
                </h2>
                <p className="text-xs text-textSecondary mt-0.5">
                  Progress seamlessly from observed telemetry to simulation and optimization.
                </p>
              </div>

              <div className="divide-y divide-hairline flex-1">
                <button
                  onClick={() => setActivePage("dna")}
                  className="group flex w-full items-center gap-4 px-6 py-3.5 text-left hover:bg-subtle/50 transition-colors"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-blue-50 text-accent ring-1 ring-blue-100">
                    <Gauge className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-textPrimary group-hover:text-accent transition-colors">
                      Review Behavioral DNA
                    </span>
                    <span className="block text-[11px] text-textSecondary truncate">
                      Inspect method priors, success dynamics, and retry transition matrices.
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-textTertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  onClick={() => setActivePage("agents")}
                  className="group flex w-full items-center gap-4 px-6 py-3.5 text-left hover:bg-subtle/50 transition-colors"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-textPrimary group-hover:text-accent transition-colors">
                      Inspect Customer Agents
                    </span>
                    <span className="block text-[11px] text-textSecondary truncate">
                      Examine the 1,000 synthetic agents calibrated to observed checkout patience.
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-textTertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  onClick={() => setActivePage("twin")}
                  className="group flex w-full items-center gap-4 px-6 py-3.5 text-left hover:bg-subtle/50 transition-colors"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-50 text-semantic-success ring-1 ring-emerald-100">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-textPrimary group-hover:text-accent transition-colors">
                      Simulate in Payment Twin
                    </span>
                    <span className="block text-[11px] text-textSecondary truncate">
                      Run discrete-event funnel counterfactuals before deploying policy changes.
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-textTertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>

              {/* Data Provenance Basis Strip */}
              <div className="border-t border-hairline px-6 py-3 bg-subtle/30 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-textSecondary">
                  <Database className="size-3.5 text-accent shrink-0" />
                  <span>
                    Data Basis:{" "}
                    <strong className="text-textPrimary font-medium">
                      {isBenchmark ? "Synthetic benchmark" : "Observed Razorpay"}
                    </strong>
                  </span>
                </span>
                <span className="font-mono text-textTertiary">
                  Grade {dnaStatus?.confidence_grade || "A"} ({formatNumber(sampleCount)} records)
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
