import React from "react";
import { MethodSimulationKPI } from "@/types/simulation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface MethodPerformanceBreakdownProps {
  methodBreakdown: Record<string, MethodSimulationKPI>;
}

export const MethodPerformanceBreakdown: React.FC<MethodPerformanceBreakdownProps> = ({
  methodBreakdown,
}) => {
  const methodIcons: Record<string, React.ElementType> = {
    upi: Smartphone,
    card: CreditCard,
    netbanking: Building2,
    wallet: Wallet,
  };

  const totalAttempts = Object.values(methodBreakdown).reduce(
    (acc, m) => acc + m.attempted_count,
    0
  );

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
            Payment Rail Performance Breakdown
          </h3>
          <p className="text-xs text-textSecondary">
            Simulated capture rates, attempt volumes, and acquirer MDR processing fees partitioned by payment method.
          </p>
        </div>
        <span className="text-[10px] font-mono text-textTertiary tabular-nums">
          {totalAttempts.toLocaleString()} Total Rail Attempts
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas/50">
              <TableHead className="w-40">Payment Method</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead className="text-right">Captured</TableHead>
              <TableHead className="text-right w-44">Success Rate</TableHead>
              <TableHead className="text-right">Captured Volume</TableHead>
              <TableHead className="text-right">MDR Fees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(methodBreakdown).map(([method, kpi]) => {
              const Icon = methodIcons[method.toLowerCase()] || CreditCard;
              const share = totalAttempts > 0 ? (kpi.attempted_count / totalAttempts) * 100 : 0;
              const isHighSuccess = kpi.success_rate_percent >= 85;

              return (
                <TableRow key={method} className="hover:bg-subtle/40 transition-colors">
                  {/* Method */}
                  <TableCell className="font-semibold text-xs text-textPrimary py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-subtle border border-hairline text-textSecondary">
                        <Icon className="size-3.5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <span className="uppercase text-xs font-bold block">
                          {method}
                        </span>
                        <span className="text-[10px] font-mono text-textTertiary font-normal block">
                          {share.toFixed(1)}% rail share
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Attempts */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textSecondary py-2.5">
                    {kpi.attempted_count.toLocaleString()}
                  </TableCell>

                  {/* Captured */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-medium text-textPrimary py-2.5">
                    {kpi.captured_count.toLocaleString()}
                  </TableCell>

                  {/* Success Rate with inline bar */}
                  <TableCell className="text-right py-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs tabular-nums font-semibold">
                        <span className={cn(isHighSuccess ? "text-emerald-700" : "text-amber-700")}>
                          {kpi.success_rate_percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-canvas overflow-hidden border border-hairline/60">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isHighSuccess ? "bg-emerald-600" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, kpi.success_rate_percent))}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Volume */}
                  <TableCell className="text-right text-xs font-mono tabular-nums font-medium text-textPrimary py-2.5">
                    ₹{kpi.captured_volume_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>

                  {/* MDR Fees */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-textTertiary py-2.5">
                    ₹{kpi.processing_fees_inr.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
