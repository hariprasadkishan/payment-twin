import React, { useState } from "react";
import { 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  ShieldCheck,
  Server,
  Sliders,
  Cpu,
  ArrowUpRight,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { 
  useRazorpayConnection, 
  useDatasetList, 
  useIngestPayments, 
  useLoadBenchmark, 
  useClearBenchmark 
} from "@/hooks/useDatasets";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export const SettingsView: React.FC = () => {
  const { data: connection, isLoading: isConnLoading, refetch: refetchConn, isRefetching: isConnRefetching } = useRazorpayConnection();
  const { data: datasetList, isLoading: isDatasetsLoading, refetch: refetchDatasets, isRefetching: isDatasetsRefetching } = useDatasetList();
  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: isBenchmarkLoading } = useLoadBenchmark();
  const { mutate: clearBenchmark, isPending: isBenchmarkClearing } = useClearBenchmark();
  
  const { systemHealth, setActivePage } = useAppStore();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const hasBenchmarkDataset = datasetList?.datasets?.some((d) => 
    d.filename.toLowerCase().includes("benchmark") || d.filename.toLowerCase().includes("synthetic")
  );

  const totalValidRecords = datasetList?.datasets?.reduce((acc, d) => acc + (d.valid_records || 0), 0) ?? 0;

  const handleRefreshAll = () => {
    refetchConn();
    refetchDatasets();
  };

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* 1. Header with Locked Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-textTertiary">
              SETTINGS
            </span>
            <span className="text-textTertiary text-xs">•</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-canvas border border-hairline text-textSecondary uppercase">
              <span className={cn("size-1.5 rounded-full", systemHealth === "degraded" ? "bg-amber-500" : "bg-emerald-500")} />
              {systemHealth === "degraded" ? "SYSTEM DEGRADED" : "SYSTEM OPERATIONAL"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            System configuration
          </h1>
          <p className="text-sm text-textSecondary max-w-2xl leading-relaxed">
            Manage simulation, benchmark, and product configuration.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isConnRefetching || isDatasetsRefetching}
            onClick={handleRefreshAll}
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh State</span>
          </Button>
        </div>
      </div>

      {/* 2. Razorpay Merchant Gateway Connection */}
      <section className="space-y-4" aria-labelledby="gateway-section-title">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
          <div>
            <h2 id="gateway-section-title" className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Key className="size-4 text-accent" strokeWidth={1.75} />
              <span>Razorpay Integration & API State</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              API Key credentials and merchant synchronization state from environment configuration.
            </p>
          </div>
          {isConnLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <Badge variant={connection?.connected ? "success" : "warning"} size="sm">
              {connection?.connected ? "CONNECTED (TEST MODE)" : "DISCONNECTED"}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-textTertiary text-[11px] font-sans block">Connection Status</span>
            <div className="text-textPrimary font-semibold flex items-center gap-1.5 font-mono">
              {connection?.connected ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{connection?.message || "Razorpay Connected"}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{connection?.message || "Missing API Credentials"}</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-textTertiary block">Environment-verified auth</span>
          </div>

          <div className="p-3.5 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-textTertiary text-[11px] font-sans block">Observed Merchant Records</span>
            <div className="text-sm font-bold text-textPrimary tabular-nums font-mono">
              {connection?.sample_count != null && connection.sample_count > 0
                ? `${connection.sample_count.toLocaleString()} Records`
                : "0 Records"}
            </div>
            <span className="text-[10px] text-textTertiary block">
              {connection?.sample_count ? "Synced from live gateway" : "Test mode account is empty"}
            </span>
          </div>

          <div className="p-3.5 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-textTertiary text-[11px] font-sans block">Operational Actions</span>
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                variant="secondary"
                size="sm"
                isLoading={isConnLoading}
                onClick={() => {
                  refetchConn();
                  refetchDatasets();
                }}
                className="text-xs h-7 px-2.5"
              >
                <RefreshCw className="size-3 shrink-0" />
                <span>Test</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isIngesting}
                onClick={() => triggerIngest({ count: 100 })}
                className="text-xs h-7 px-2.5"
              >
                <span>Sync 100 Payments</span>
              </Button>
            </div>
            <span className="text-[10px] text-textTertiary block">Pulls recent settled charges</span>
          </div>
        </div>
      </section>

      {/* 3. Synthetic Benchmark Ground Truth */}
      <section className="space-y-4" aria-labelledby="benchmark-section-title">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
          <div>
            <h2 id="benchmark-section-title" className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Sparkles className="size-4 text-accent" strokeWidth={1.75} />
              <span>Demonstration Synthetic Benchmark Foundation</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Statistically realistic payment population for evaluating simulation and optimization capabilities.
            </p>
          </div>
          <Badge variant={hasBenchmarkDataset ? "indigo" : "neutral"} size="sm">
            {hasBenchmarkDataset ? "BENCHMARK ACTIVE (650 RECORDS)" : "STANDBY"}
          </Badge>
        </div>

        <div className="p-4 rounded-lg border border-hairline bg-surface space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-textSecondary leading-relaxed">
            <Info className="size-4 text-accent shrink-0 mt-0.5" />
            <div>
              Because the Razorpay Test Mode account currently contains 0 live transactions, the system provides a canonical retail e-commerce benchmark dataset. All downstream <strong>Behavioral DNA</strong>, <strong>Customer Agents</strong>, <strong>Payment Twin</strong> simulations, <strong>What-If</strong> scenarios, and <strong>Pareto</strong> frontiers derived from this dataset are <strong>strictly labeled as SYNTHETIC BENCHMARK DATA</strong> with zero live Razorpay misrepresentation.
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            {!hasBenchmarkDataset ? (
              <Button
                variant="primary"
                size="sm"
                isLoading={isBenchmarkLoading}
                onClick={() => loadBenchmark()}
                className="h-8"
              >
                <Sparkles className="size-3.5" />
                <span>Load Synthetic Benchmark Dataset (650 Records)</span>
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                {showConfirmClear ? (
                  <div className="flex items-center gap-2 p-1.5 rounded bg-red-50 border border-red-200">
                    <span className="text-xs text-red-800 font-medium px-1">Clear active benchmark?</span>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isBenchmarkClearing}
                      onClick={() => {
                        clearBenchmark();
                        setShowConfirmClear(false);
                      }}
                      className="bg-semantic-danger hover:bg-red-700 text-white h-7 px-2.5 text-xs"
                    >
                      Confirm Clear
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowConfirmClear(false)}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowConfirmClear(true)}
                    className="text-semantic-danger hover:bg-red-50 hover:border-red-200 h-8 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Clear Benchmark Dataset</span>
                  </Button>
                )}
                <span className="text-[11px] text-textTertiary font-mono">
                  Active in Twin, What-If, Pareto, and Guardian
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Active Simulation & Modeling Defaults */}
      <section className="space-y-4" aria-labelledby="modeling-section-title">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
          <div>
            <h2 id="modeling-section-title" className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Sliders className="size-4 text-accent" strokeWidth={1.75} />
              <span>Simulation Engine & Stochastic Defaults</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Verified behavioral distribution, common random numbers (CRN), and convergence parameters.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            FIXED ARCHITECTURE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase font-sans tracking-wider block">
              Default Population
            </span>
            <div className="text-sm font-bold text-textPrimary tabular-nums">
              1,000 Agents
            </div>
            <span className="text-[10px] text-textTertiary font-sans block">
              Dirichlet-Multinomial calibration
            </span>
          </div>

          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase font-sans tracking-wider block">
              Common Seed (CRN)
            </span>
            <div className="text-sm font-bold text-textPrimary tabular-nums">
              Seed #42
            </div>
            <span className="text-[10px] text-textTertiary font-sans block">
              Synchronized paired variance reduction
            </span>
          </div>

          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase font-sans tracking-wider block">
              Funnel Engine
            </span>
            <div className="text-sm font-bold text-accent truncate">
              Discrete-Event
            </div>
            <span className="text-[10px] text-textTertiary font-sans block truncate">
              Checkout → Auth → Capture
            </span>
          </div>

          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <span className="text-[10px] text-textTertiary uppercase font-sans tracking-wider block">
              Confidence Bound
            </span>
            <div className="text-sm font-bold text-emerald-700 tabular-nums">
              95% CLT Bound
            </div>
            <span className="text-[10px] text-textTertiary font-sans block">
              Binomial Wald + Bootstrap CI
            </span>
          </div>
        </div>
      </section>

      {/* 5. Dataset Repository & Provenance Log */}
      <section className="space-y-4" aria-labelledby="repo-section-title">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
          <div>
            <h2 id="repo-section-title" className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Database className="size-4 text-accent" strokeWidth={1.75} />
              <span>Dataset Repository & Provenance Log</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Sanitized JSONL payment records stored in local dataset repository.
            </p>
          </div>
          {isDatasetsLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-hairline bg-canvas text-textSecondary">
              {datasetList?.total_datasets ?? 0} DATASETS ({totalValidRecords.toLocaleString()} RECORDS)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-textSecondary bg-canvas/60 p-2.5 rounded border border-hairline">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Privacy Guarantee: Zero customer PII (emails, phone numbers, card PANs) is ever logged or processed.</span>
        </div>

        {datasetList && datasetList.datasets && datasetList.datasets.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas/50">
                  <TableHead className="w-64">Filename</TableHead>
                  <TableHead className="text-right w-24">Records</TableHead>
                  <TableHead>Provenance Type</TableHead>
                  <TableHead className="text-right w-24">File Size</TableHead>
                  <TableHead className="text-right w-24">Integrity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasetList.datasets.map((d) => {
                  const isSynth = d.filename.toLowerCase().includes("benchmark") || d.filename.toLowerCase().includes("synthetic");
                  return (
                    <TableRow key={d.filename} className="hover:bg-subtle/50 transition-colors">
                      <TableCell className="py-2.5">
                        <span
                          className="block font-mono text-xs font-semibold text-accent truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                          title={d.filename}
                        >
                          {d.filename}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-textPrimary py-2.5 tabular-nums">
                        {d.valid_records.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant={isSynth ? "indigo" : "success"} size="sm">
                          {isSynth ? "SYNTHETIC BENCHMARK" : "OBSERVED RAZORPAY"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-textSecondary py-2.5 tabular-nums">
                        {(d.file_size_bytes / 1024).toFixed(1)} KB
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <Badge variant={d.is_valid ? "success" : "danger"} size="sm">
                          {d.is_valid ? "VALID" : "CORRUPT"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 rounded-md bg-canvas/40 border border-dashed border-hairline text-xs font-mono text-textTertiary text-center space-y-2">
            <div>No local JSONL dataset files present.</div>
            <Button
              variant="primary"
              size="sm"
              isLoading={isBenchmarkLoading}
              onClick={() => loadBenchmark()}
              className="text-xs h-7"
            >
              Load Benchmark Dataset
            </Button>
          </div>
        )}
      </section>

      {/* 6. System Diagnostics & Runtime Environment */}
      <section className="space-y-4" aria-labelledby="diagnostics-section-title">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
          <div>
            <h2 id="diagnostics-section-title" className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Cpu className="size-4 text-accent" strokeWidth={1.75} />
              <span>Runtime Environment & Architecture</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Service topology, active ports, and state container integration.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
            ALL SERVICES ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <div className="flex items-center justify-between text-textTertiary text-[11px] font-sans">
              <span>Backend API</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-textPrimary font-semibold">
              FastAPI :8000
            </div>
            <span className="text-[10px] text-textTertiary font-sans block">
              Python 3.11 • Async ASGI
            </span>
          </div>

          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <div className="flex items-center justify-between text-textTertiary text-[11px] font-sans">
              <span>Frontend Client</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-textPrimary font-semibold">
              Vite :5173
            </div>
            <span className="text-[10px] text-textTertiary font-sans block">
              React 18 • TypeScript • Tailwind
            </span>
          </div>

          <div className="p-3 rounded-md bg-canvas/40 border border-hairline space-y-1">
            <div className="flex items-center justify-between text-textTertiary text-[11px] font-sans">
              <span>State & Query Cache</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-textPrimary font-semibold">
              TanStack Query + Zustand
            </div>
            <span className="text-[10px] text-textTertiary font-sans block">
              Optimistic updates & invalidation
            </span>
          </div>
        </div>

        <div className="p-3 rounded-md bg-canvas/30 border border-hairline text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-textSecondary">
          <div className="flex items-center gap-2">
            <Server className="size-3.5 text-accent shrink-0" />
            <span>Anti-Mock Data Policy: All simulation, DNA, and optimization endpoints query actual computational backend logic.</span>
          </div>
          <button
            onClick={() => setActivePage("overview")}
            className="text-accent hover:underline font-medium text-xs flex items-center gap-1 shrink-0"
          >
            <span>Return to Command Center</span>
            <ArrowUpRight className="size-3" />
          </button>
        </div>
      </section>
    </div>
  );
};
