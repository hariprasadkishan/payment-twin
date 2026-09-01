import React from "react";
import { Database, Key, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useRazorpayConnection, useDatasetList, useIngestPayments } from "@/hooks/useDatasets";

export const SettingsView: React.FC = () => {
  const { data: connection, isLoading: isConnLoading, refetch: refetchConn } = useRazorpayConnection();
  const { data: datasetList, isLoading: isDatasetsLoading, refetch: refetchDatasets } = useDatasetList();
  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();

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
            <span className="text-twin-slate">Available Payment Records:</span>
            <div className="text-twin-white font-semibold">
              {connection?.sample_count !== undefined && connection?.sample_count !== null
                ? `${connection.sample_count} Records Found`
                : "0 Records (Empty Test Mode)"}
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

      {/* Dataset Repository & Auditing Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-4">
        <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-indigo/10 border border-twin-indigo/20 text-twin-indigo">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-twin-white">
                Dataset Repository & Lineage
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

        <p className="text-xs text-twin-slate leading-relaxed">
          Payment Twin operates strictly on sanitized, redacted payment records. Zero customer PII (emails, phone numbers, card PANs) is ever stored or processed.
        </p>

        {/* Dataset files table */}
        {datasetList && datasetList.datasets && datasetList.datasets.length > 0 ? (
          <div className="pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Valid Records</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasetList.datasets.map((d) => (
                  <TableRow key={d.filename}>
                    <TableCell className="font-mono text-xs text-twin-cyan truncate max-w-xs">
                      {d.filename}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-white">
                      {d.valid_records}
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
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-twin-card/30 border border-twin-border/50 text-xs font-mono text-twin-slate text-center">
            No local JSONL dataset files present. Sync payments to establish dataset foundation.
          </div>
        )}
      </div>
    </div>
  );
};
