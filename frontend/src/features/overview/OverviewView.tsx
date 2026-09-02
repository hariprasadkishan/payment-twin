import React from "react";
import { ArrowRight, Bot, ChartNoAxesCombined, FlaskConical, Gauge, RefreshCw, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDatasetSummary, useIngestPayments, useLoadBenchmark } from "@/hooks/useDatasets";
import { useDNAStatus } from "@/hooks/useDNA";
import { useGuardianStatus } from "@/hooks/useGuardian";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { DistributionBar, MethodShareItem } from "@/components/domain/DistributionBar";

const formatMoney = (value?: number | null) => value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const formatNumber = (value?: number | null) => value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);

export const OverviewView: React.FC = () => {
  const { setActivePage } = useAppStore();
  const { data: summary, isLoading: summaryLoading, isError: summaryError, error, refetch } = useDatasetSummary();
  const { data: dnaStatus, isLoading: dnaLoading } = useDNAStatus();
  const { data: guardianStatus } = useGuardianStatus();
  const { mutate: ingestPayments, isPending: ingesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: loadingBenchmark } = useLoadBenchmark();
  const loading = summaryLoading && dnaLoading;
  const hasData = Boolean(dnaStatus?.profiling_available || (summary?.total_records && summary.total_records > 0));
  const total = summary?.total_records ?? 0;
  const status = summary?.status_metrics;
  const financial = summary?.financial_metrics;
  const isBenchmark = dnaStatus?.provenance_type === "SYNTHETIC_BENCHMARK_DATA";
  const sampleCount = dnaStatus?.available_sample_count || total;
  const methodItems = React.useMemo<MethodShareItem[]>(() => {
    if (!summary?.method_distribution || total === 0) return [];
    const colors = ["#243b7a", "#455ca4", "#7292c9", "#8e9b95", "#b08b48"];
    return Object.entries(summary.method_distribution).sort(([, a], [, b]) => b - a).map(([method, count], index) => ({ key: method, label: method, percentage: count / total * 100, color: colors[index % colors.length] }));
  }, [summary, total]);
  const topMethods = methodItems.slice(0, 5);

  if (loading) return <div className="space-y-6"><div className="grid grid-cols-2 divide-x divide-y rounded-lg border bg-white sm:grid-cols-3 lg:grid-cols-5"><Skeleton className="h-28 rounded-none border-0" /><Skeleton className="h-28 rounded-none border-0" /><Skeleton className="h-28 rounded-none border-0" /><Skeleton className="h-28 rounded-none border-0" /><Skeleton className="h-28 rounded-none border-0" /></div><div className="grid gap-5 lg:grid-cols-12"><Skeleton className="h-96 rounded-lg lg:col-span-8" /><Skeleton className="h-96 rounded-lg lg:col-span-4" /></div></div>;
  if (summaryError && !dnaStatus) return <ErrorAlert title="Payment data is unavailable" message={(error as Error)?.message || "The payment summary could not be loaded."} onRetry={() => refetch()} />;

  const metrics = [
    { label: "Payment attempts", value: formatNumber(total), detail: hasData ? `${formatNumber(sampleCount)} records analyzed` : "No data loaded" },
    { label: "Captured payments", value: formatNumber(status?.captured_count), detail: status ? `${formatNumber(status.failed_count)} failed` : "Awaiting payment data" },
    { label: "Capture rate", value: status ? `${status.success_rate_percent.toFixed(1)}%` : "—", detail: status ? `${status.failure_rate_percent.toFixed(1)}% failure rate` : "Awaiting payment data", success: true },
    { label: "Payment volume", value: formatMoney(financial?.total_amount_inr), detail: financial ? `${formatMoney(financial.total_fee_inr)} in fees` : "Awaiting payment data" },
    { label: "Average ticket", value: formatMoney(financial?.average_amount_inr), detail: financial ? `Median ${formatMoney(financial.median_amount_inr)}` : "Awaiting payment data" },
  ];

  return <div className="space-y-6 pb-8">
    <section className="flex flex-col justify-between gap-4 border-b border-[#e2e4df] pb-5 sm:flex-row sm:items-end">
      <div><p className="text-sm text-[#5e6963]">A concise view of payment performance and the next place to investigate.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => setActivePage("dna")}><ChartNoAxesCombined className="size-4" />View behavioral DNA</Button><Button variant="primary" size="sm" onClick={() => setActivePage("twin")}><Sparkles className="size-4" />Open Payment Twin</Button></div>
    </section>

    <section aria-label="Payment performance" className="grid grid-cols-2 divide-x divide-y divide-[#e2e4df] overflow-hidden rounded-lg border border-[#e2e4df] bg-white sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric) => <div key={metric.label} className="min-w-0 p-4 sm:p-5"><p className="text-xs text-[#5e6963]">{metric.label}</p><p className={`mt-2 truncate text-xl font-semibold tracking-[-0.03em] tabular-nums ${metric.success ? "text-[#237b4b]" : "text-[#17211d]"}`}>{metric.value}</p><p className="mt-1 truncate text-[11px] text-[#87908a]">{metric.detail}</p></div>)}
    </section>

    {!hasData ? <section className="border border-[#e2e4df] bg-white p-6 sm:p-8"><div className="max-w-2xl"><h2 className="text-lg font-semibold tracking-[-0.02em]">Start with a payment dataset</h2><p className="mt-2 text-sm leading-6 text-[#5e6963]">Load the provided synthetic benchmark to explore the full product, or synchronize Razorpay Test Mode payments to create a merchant-specific baseline.</p><div className="mt-5 flex flex-wrap gap-2"><Button isLoading={loadingBenchmark} onClick={() => loadBenchmark()}><FlaskConical className="size-4" />Load benchmark dataset</Button><Button variant="secondary" isLoading={ingesting} onClick={() => ingestPayments({ count: 100 })}><RefreshCw className="size-4" />Sync test payments</Button></div></div></section> : <>
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="border border-[#e2e4df] bg-white lg:col-span-8"><div className="flex flex-col justify-between gap-3 border-b border-[#e2e4df] px-5 py-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold tracking-[-0.01em]">Payment method performance</h2><p className="mt-0.5 text-xs text-[#5e6963]">Share of payment attempts in the current dataset.</p></div><button onClick={() => setActivePage("dna")} className="inline-flex items-center gap-1 text-xs font-medium text-[#243b7a] hover:text-[#1c3066]">Explore behavioral DNA <ArrowRight className="size-3.5" /></button></div><div className="p-5"><DistributionBar items={methodItems} /><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead className="border-b text-xs font-medium text-[#5e6963]"><tr><th className="pb-3">Payment method</th><th className="pb-3 text-right">Attempts</th><th className="pb-3 text-right">Share</th></tr></thead><tbody className="divide-y divide-[#e2e4df]">{topMethods.map((method) => <tr key={method.key}><td className="py-3 font-medium capitalize text-[#17211d]"><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: method.color }} />{method.label}</td><td className="py-3 text-right tabular-nums text-[#17211d]">{formatNumber(summary?.method_distribution[method.key])}</td><td className="py-3 text-right tabular-nums text-[#5e6963]">{method.percentage.toFixed(1)}%</td></tr>)}</tbody></table></div></div></div>
        <aside className="flex flex-col border border-[#e2e4df] bg-white lg:col-span-4"><div className="border-b border-[#e2e4df] p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold tracking-[-0.01em]">Guardian attention</h2><span className={`rounded px-2 py-0.5 text-[11px] font-medium ${guardianStatus?.guardian_available ? "bg-[#e9f5ee] text-[#237b4b]" : "bg-[#f0f1ee] text-[#5e6963]"}`}>{guardianStatus?.guardian_available ? "Available" : "Unavailable"}</span></div><p className="mt-1 text-xs leading-5 text-[#5e6963]">Statistical deviations that may need investigation.</p></div><div className="flex-1 p-5">{guardianStatus?.guardian_available ? <><p className="text-3xl font-semibold tracking-[-0.03em] tabular-nums text-[#17211d]">{guardianStatus.active_alerts_count}</p><p className="mt-1 text-sm text-[#5e6963]">active {guardianStatus.active_alerts_count === 1 ? "alert" : "alerts"}</p><p className="mt-5 border-t border-[#e2e4df] pt-4 text-xs leading-5 text-[#5e6963]">Baseline sample: {formatNumber(guardianStatus.baseline_sample_size)} payments. Guardian identifies statistical deviations; it does not establish causality.</p></> : <p className="text-sm leading-6 text-[#5e6963]">Guardian becomes available after a Behavioral DNA baseline is created.</p>}</div><div className="border-t border-[#e2e4df] p-4"><Button variant="outline" size="sm" className="w-full" onClick={() => setActivePage("guardian")}><ShieldAlert className="size-4" />Review Guardian</Button></div></aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <div className="border border-[#e2e4df] bg-white lg:col-span-7"><div className="border-b border-[#e2e4df] px-5 py-4"><h2 className="text-sm font-semibold tracking-[-0.01em]">Next actions</h2><p className="mt-0.5 text-xs text-[#5e6963]">Continue from observed data to a decision.</p></div><div className="divide-y divide-[#e2e4df]"><button onClick={() => setActivePage("dna")} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#f7f7f5]"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#e8edfb] text-[#243b7a]"><Gauge className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#17211d]">Review payment behavior</span><span className="mt-0.5 block text-xs text-[#5e6963]">Inspect payment mix, success dynamics, and failure patterns.</span></span><ArrowRight className="size-4 text-[#87908a] group-hover:text-[#243b7a]" /></button><button onClick={() => setActivePage("agents")} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#f7f7f5]"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#eef1fa] text-[#455ca4]"><Bot className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#17211d]">Inspect customer agents</span><span className="mt-0.5 block text-xs text-[#5e6963]">See the synthetic population calibrated from the current baseline.</span></span><ArrowRight className="size-4 text-[#87908a] group-hover:text-[#243b7a]" /></button><button onClick={() => setActivePage("twin")} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#f7f7f5]"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#e9f5ee] text-[#237b4b]"><ShieldCheck className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#17211d]">Simulate a payment decision</span><span className="mt-0.5 block text-xs text-[#5e6963]">Test an intervention before applying it to production.</span></span><ArrowRight className="size-4 text-[#87908a] group-hover:text-[#243b7a]" /></button></div></div>
        <aside className="border border-[#e2e4df] bg-[#f0f1ee] p-5 lg:col-span-5"><p className="text-xs font-medium text-[#5e6963]">Current data basis</p><h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#17211d]">{isBenchmark ? "Synthetic benchmark dataset" : "Observed Razorpay dataset"}</h2><p className="mt-2 text-sm leading-6 text-[#5e6963]">{isBenchmark ? "Use simulation results as directional projections from benchmark behavior, not as merchant observations." : "The workspace reflects the records currently available through the configured data source."}</p><dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-[#d1d5ce] pt-4 text-sm"><div><dt className="text-xs text-[#5e6963]">Records</dt><dd className="mt-1 font-medium tabular-nums text-[#17211d]">{formatNumber(sampleCount)}</dd></div><div><dt className="text-xs text-[#5e6963]">Confidence grade</dt><dd className="mt-1 font-medium text-[#17211d]">{dnaStatus?.confidence_grade || "Unavailable"}</dd></div></dl></aside>
      </section>
    </>}
  </div>;
};
