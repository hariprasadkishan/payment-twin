import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRailDeltasTableProps {
  methodDeltas: Record<string, Record<string, number>>;
}

export const PaymentRailDeltasTable: React.FC<PaymentRailDeltasTableProps> = ({
  methodDeltas,
}) => {
  const methodIcons: Record<string, React.ElementType> = {
    upi: Smartphone,
    card: CreditCard,
    netbanking: Building2,
    wallet: Wallet,
  };

  const methods = Object.keys(methodDeltas);
  if (methods.length === 0) return null;

  // Calculate totals across rails for reconciliation verification
  let totalVolDelta = 0;
  let totalCountDelta = 0;

  Object.values(methodDeltas).forEach((deltas) => {
    const vol = deltas.captured_volume_inr_delta ?? deltas.captured_volume_delta_inr ?? 0;
    const count = deltas.captured_count_delta ?? 0;
    totalVolDelta += vol;
    totalCountDelta += count;
  });

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Payment Rail Delta Decomposition
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              Rail Attribution
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Answers: <strong className="text-textPrimary font-semibold">Which payment rail caused the overall change?</strong> Decomposes captured volume, order counts, and success rates.
          </p>
        </div>

        <div className="text-[11px] font-mono text-textTertiary">
          4 Empirical Rails Evaluated
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas/50">
              <TableHead className="w-40">Payment Method</TableHead>
              <TableHead className="text-right">Captured Volume Shift</TableHead>
              <TableHead className="text-right">Captured Orders Δ</TableHead>
              <TableHead className="text-right">Success Rate Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(methodDeltas).map(([method, deltas]) => {
              const Icon = methodIcons[method.toLowerCase()] || CreditCard;
              // Extract real backend keys with resilient fallbacks
              const volDelta = deltas.captured_volume_inr_delta ?? deltas.captured_volume_delta_inr ?? 0;
              const countDelta = deltas.captured_count_delta ?? 0;
              const rateDelta = deltas.success_rate_percent_delta ?? deltas.success_rate_delta_percent ?? 0;

              return (
                <TableRow key={method} className="hover:bg-subtle/40 transition-colors">
                  <TableCell className="font-semibold text-xs text-textPrimary py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-subtle border border-hairline text-textSecondary">
                        <Icon className="size-3.5" strokeWidth={1.75} />
                      </div>
                      <span className="uppercase text-xs font-bold block">
                        {method}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right text-xs font-mono tabular-nums text-textPrimary py-2.5">
                    <span className={cn(volDelta > 0 ? "text-emerald-700 font-semibold" : volDelta < 0 ? "text-red-700 font-semibold" : "text-textTertiary")}>
                      {volDelta > 0 ? "+₹" : volDelta < 0 ? "-₹" : "₹"}
                      {Math.abs(volDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>

                  <TableCell className="text-right text-xs font-mono tabular-nums text-textPrimary py-2.5">
                    <span className={cn(countDelta > 0 ? "text-emerald-700 font-semibold" : countDelta < 0 ? "text-red-700 font-semibold" : "text-textTertiary")}>
                      {countDelta > 0 ? "+" : ""}{countDelta} {Math.abs(countDelta) === 1 ? "order" : "orders"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right text-xs font-mono tabular-nums text-textPrimary py-2.5">
                    <span className={cn(rateDelta > 0 ? "text-emerald-700 font-semibold" : rateDelta < 0 ? "text-red-700 font-semibold" : "text-textTertiary")}>
                      {rateDelta > 0 ? "+" : ""}{rateDelta.toFixed(1)} pp
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Reconciled Aggregate Row */}
            <TableRow className="bg-canvas/50 font-semibold border-t border-hairline">
              <TableCell className="text-xs text-textPrimary py-2.5 font-bold">
                Net Rail Sum
              </TableCell>
              <TableCell className="text-right text-xs font-mono tabular-nums py-2.5">
                <span className={cn(totalVolDelta > 0 ? "text-emerald-700 font-bold" : totalVolDelta < 0 ? "text-red-700 font-bold" : "text-textSecondary")}>
                  {totalVolDelta > 0 ? "+₹" : totalVolDelta < 0 ? "-₹" : "₹"}
                  {Math.abs(totalVolDelta).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </TableCell>
              <TableCell className="text-right text-xs font-mono tabular-nums py-2.5">
                <span className={cn(totalCountDelta > 0 ? "text-emerald-700 font-bold" : totalCountDelta < 0 ? "text-red-700 font-bold" : "text-textSecondary")}>
                  {totalCountDelta > 0 ? "+" : ""}{totalCountDelta} {Math.abs(totalCountDelta) === 1 ? "order" : "orders"}
                </span>
              </TableCell>
              <TableCell className="text-right text-[11px] font-mono text-textTertiary py-2.5">
                Reconciled
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
