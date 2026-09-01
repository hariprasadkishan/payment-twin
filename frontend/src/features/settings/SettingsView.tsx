import React from "react";
import { 
  Database, 
  Key, 
  CheckCircle, 
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
    <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl">
      {/* Razorpay Connection Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-4">
        <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-cyan/10 border border-twin-cyan/20 text-twin-cyan">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-twin-white">
                Razorpay API Test Mode
              </h3>
              <p className="text-xs text-twin-slate">
                API Key credentials and connection status from backend environment.
              </p>
            </div>
          </div>
          {isConnLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <Badge variant={connection?.connected ? "cyan" : "warning"} size="md">
              {connection?.status?.toUpperCase() || (connection?.connected ? "CONNECTED" : "UNAVAILABLE")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/60 space-y-1">
            <span className="text-twin-slate">Connection Status:</span>
            <div className="text-twin-white font-semibold flex items-center gap-1.5">
              {connection?.connected ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-twin-success" />
                  <span>{connection?.message || "Razorpay Test Mode Connected"}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-twin-warning" />
                  <span>{connection?.message || "Not Connected / Credentials Missing"}</span>
                </>
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/60 space-y-1">
            <span className="text-twin-slate">Live Observed Records:</span>
            <div className="text-twin-white font-semibold">
              {connection?.sample_count != null && connection.sample_count > 0
                ? `${connection.sample_count} Records Found`
                : "0 Records (Empty Test Account)"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isConnLoading}
            onClick={() => {
              refetchConn();
              refetchDatasets();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Test Connection
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isIngesting}
            onClick={() => triggerIngest({ count: 100 })}
          >
            Sync Test Payments
          </Button>
        </div>
      </div>

      {/* Synthetic Benchmark Demonstration Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-4">
        <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-warning/10 border border-twin-warning/20 text-twin-warning">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-twin-white">
                Demonstration Synthetic Benchmark Foundation
              </h3>
              <p className="text-xs text-twin-slate">
                Statistically realistic payment population for evaluating Twin & Optimization capabilities.
              </p>
            </div>
          </div>
          <Badge variant={hasBenchmarkDataset ? "warning" : "neutral"} size="md">
            {hasBenchmarkDataset ? "SYNTHETIC BENCHMARK ACTIVE" : "STANDBY"}
          </Badge>
        </div>

        <p className="text-xs text-twin-slate leading-relaxed">
          Because your Razorpay Test Mode account currently contains 0 live transactions, you can load a canonical retail e-commerce benchmark dataset. All downstream Behavioral DNA, Customer Agents, Twin simulations, What-If scenarios, and Pareto frontiers derived from this dataset are <strong>strictly labeled as SYNTHETIC BENCHMARK DATA</strong> with zero live Razorpay misrepresentation.
        </p>

        <div className="flex items-center gap-3 pt-2">
          {!hasBenchmarkDataset ? (
            <Button
              variant="primary"
              size="sm"
              isLoading={isBenchmarkLoading}
              onClick={() => loadBenchmark()}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Synthetic Benchmark Dataset (650 Records)
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isBenchmarkClearing}
              onClick={() => clearBenchmark()}
              className="text-twin-danger hover:bg-twin-danger/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Benchmark Dataset
            </Button>
          )}
        </div>
      </div>

      {/* Dataset Repository & Auditing Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-4">
        <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-indigo/10 border border-twin-indigo/20 text-twin-indigo">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-twin-white">
                Dataset Repository & Provenance Log
              </h3>
              <p className="text-xs text-twin-slate">
                Sanitized JSONL payment records stored in local dataset foundation.
              </p>
            </div>
          </div>
          {isDatasetsLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <Badge variant="neutral" size="md">
              {datasetList?.total_datasets ?? 0} DATASETS
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-twin-slate">
          <ShieldCheck className="w-4 h-4 text-twin-success" />
          <span>Privacy Guarantee: Zero customer PII (emails, phone numbers, card PANs) is ever logged or processed.</span>
        </div>

        {/* Dataset files table */}
        {datasetList && datasetList.datasets && datasetList.datasets.length > 0 ? (
          <div className="pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Provenance Type</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasetList.datasets.map((d) => {
                  const isSynth = d.filename.toLowerCase().includes("benchmark") || d.filename.toLowerCase().includes("synthetic");
                  return (
                    <TableRow key={d.filename}>
                      <TableCell className="font-mono text-xs text-twin-cyan truncate max-w-xs">
                        {d.filename}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-twin-white">
                        {d.valid_records}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isSynth ? "warning" : "cyan"} size="sm">
                          {isSynth ? "SYNTHETIC BENCHMARK" : "OBSERVED RAZORPAY"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-twin-slate">
                        {(d.file_size_bytes / 1024).toFixed(1)} KB
                      </TableCell>
                      <TableCell className="text-right">
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
          <div className="p-4 rounded-lg bg-twin-card/30 border border-twin-border/50 text-xs font-mono text-twin-slate text-center">
            No local JSONL dataset files present. Load synthetic benchmark or sync live payments to begin.
          </div>
        )}
      </div>
    </div>
  );
};
