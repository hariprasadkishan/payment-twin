import React from "react";
import { 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  ShieldCheck 
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

export const SettingsView: React.FC = () => {
  const { data: connection, isLoading: isConnLoading, refetch: refetchConn } = useRazorpayConnection();
  const { data: datasetList, isLoading: isDatasetsLoading, refetch: refetchDatasets } = useDatasetList();
  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: isBenchmarkLoading } = useLoadBenchmark();
  const { mutate: clearBenchmark, isPending: isBenchmarkClearing } = useClearBenchmark();

  const hasBenchmarkDataset = datasetList?.datasets?.some((d) => 
    d.filename.toLowerCase().includes("benchmark") || d.filename.toLowerCase().includes("synthetic")
  );

  return (
    <div className="space-y-5 max-w-4xl pb-12">
      {/* 1. Razorpay Connection Card */}
      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-accent">
              <Key className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
                Razorpay API Test Mode Connection
              </h3>
              <p className="text-xs text-textSecondary">
                API Key credentials and merchant synchronization state from environment configuration.
              </p>
            </div>
          </div>
          {isConnLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <Badge variant={connection?.connected ? "success" : "warning"} size="md">
              {connection?.status?.toUpperCase() || (connection?.connected ? "CONNECTED" : "UNAVAILABLE")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-md bg-canvas/50 border border-hairline space-y-1">
            <span className="text-textTertiary text-[11px] font-sans">Connection Status:</span>
            <div className="text-textPrimary font-semibold flex items-center gap-1.5">
              {connection?.connected ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{connection?.message || "Razorpay Test Mode Connected"}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{connection?.message || "Not Connected / Missing Credentials"}</span>
                </>
              )}
            </div>
          </div>
          <div className="p-3 rounded-md bg-canvas/50 border border-hairline space-y-1">
            <span className="text-textTertiary text-[11px] font-sans">Live Observed Records:</span>
            <div className="text-textPrimary font-semibold">
              {connection?.sample_count != null && connection.sample_count > 0
                ? `${connection.sample_count.toLocaleString()} Records Synced`
                : "0 Records (Empty Test Account)"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isConnLoading}
            onClick={() => {
              refetchConn();
              refetchDatasets();
            }}
          >
            <RefreshCw className="size-3.5" />
            <span>Test Connection</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isIngesting}
            onClick={() => triggerIngest({ count: 100 })}
          >
            <span>Sync Test Payments</span>
          </Button>
        </div>
      </div>

      {/* 2. Synthetic Benchmark Foundation Card */}
      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-indigo-50 border border-indigo-200 text-accent">
              <Sparkles className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
                Demonstration Synthetic Benchmark Foundation
              </h3>
              <p className="text-xs text-textSecondary">
                Statistically realistic payment population for evaluating simulation and optimization capabilities.
              </p>
            </div>
          </div>
          <Badge variant={hasBenchmarkDataset ? "indigo" : "neutral"} size="md">
            {hasBenchmarkDataset ? "BENCHMARK ACTIVE" : "STANDBY"}
          </Badge>
        </div>

        <p className="text-xs text-textSecondary leading-relaxed">
          Because your Razorpay Test Mode account currently contains 0 live transactions, you can load a canonical retail e-commerce benchmark dataset. All downstream Behavioral DNA, Customer Agents, Twin simulations, What-If scenarios, and Pareto frontiers derived from this dataset are <strong>strictly labeled as SYNTHETIC BENCHMARK DATA</strong> with zero live Razorpay misrepresentation.
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          {!hasBenchmarkDataset ? (
            <Button
              variant="primary"
              size="sm"
              isLoading={isBenchmarkLoading}
              onClick={() => loadBenchmark()}
            >
              <Sparkles className="size-3.5" />
              <span>Load Synthetic Benchmark Dataset (650 Records)</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isBenchmarkClearing}
              onClick={() => clearBenchmark()}
              className="text-semantic-danger hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
              <span>Clear Benchmark Dataset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Dataset Repository & Provenance Log Card */}
      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-subtle border border-hairline text-textSecondary">
              <Database className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
                Dataset Repository & Provenance Log
              </h3>
              <p className="text-xs text-textSecondary">
                Sanitized JSONL payment records stored in local dataset repository.
              </p>
            </div>
          </div>
          {isDatasetsLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-hairline bg-canvas text-textSecondary">
              {datasetList?.total_datasets ?? 0} DATASETS
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-textSecondary bg-canvas/50 p-2.5 rounded border border-hairline">
          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
          <span>Privacy Guarantee: Zero customer PII (emails, phone numbers, card PANs) is ever logged or processed.</span>
        </div>

        {/* Dataset files table */}
        {datasetList && datasetList.datasets && datasetList.datasets.length > 0 ? (
          <div className="pt-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas/50">
                  <TableHead className="w-56">Filename</TableHead>
                  <TableHead className="text-right w-24">Records</TableHead>
                  <TableHead>Provenance Type</TableHead>
                  <TableHead className="text-right w-24">File Size</TableHead>
                  <TableHead className="text-right w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasetList.datasets.map((d) => {
                  const isSynth = d.filename.toLowerCase().includes("benchmark") || d.filename.toLowerCase().includes("synthetic");
                  return (
                    <TableRow key={d.filename} className="hover:bg-subtle/50 transition-colors">
                      <TableCell className="py-2.5">
                        <span
                          className="block font-mono text-xs font-semibold text-accent truncate max-w-[160px] sm:max-w-[220px] md:max-w-xs lg:max-w-sm"
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
          <div className="p-6 rounded-md bg-canvas/40 border border-hairline text-xs font-mono text-textTertiary text-center">
            No local JSONL dataset files present. Load synthetic benchmark or sync live payments to begin.
          </div>
        )}
      </div>
    </div>
  );
};
