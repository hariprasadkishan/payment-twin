import React, { useState } from "react";
import { SimulationResult } from "@/types/simulation";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  UserX, 
  CreditCard, 
  ShieldCheck, 
  Server, 
  ShoppingCart,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentFunnelInstrumentProps {
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  populationSize: number;
}

export const PaymentFunnelInstrument: React.FC<PaymentFunnelInstrumentProps> = ({
  simulationResult,
  isSimulating,
  populationSize,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const kpis = simulationResult?.kpis;
  const dropoffs = simulationResult?.funnel_dropoffs || {};

  const totalPop = kpis?.total_agents ?? populationSize;
  const preCheckoutLoss = dropoffs.PRE_CHECKOUT_DROP ?? 0;
  const authLoss = dropoffs.AUTH_TIMEOUT ?? 0;
  const declineLoss = dropoffs.GAVE_UP_AFTER_DECLINE ?? (kpis?.failed_transactions ?? 0);
  const maxRetriesLoss = dropoffs.MAX_RETRIES_EXCEEDED ?? 0;

  const cartPop = Math.max(0, totalPop - preCheckoutLoss);
  const checkoutPop = cartPop;
  const authAttempts = kpis?.total_payment_attempts ?? Math.round(cartPop * 1.15);
  const gatewayAttempts = Math.max(0, authAttempts - authLoss);

  const capturedCount = kpis?.successful_transactions ?? Math.round(totalPop * 0.83);
  const retriedCount = kpis?.retry_attempts_count ?? Math.round(totalPop * 0.15);
  const failedCount = kpis?.failed_transactions ?? Math.round(totalPop * 0.155);
  const abandonedCount = kpis?.abandoned_transactions ?? Math.max(0, totalPop - capturedCount - failedCount);

  const captureRate = kpis ? kpis.conversion_rate_percent : 83.0;

  // 5 Main Traversal Stages
  const stages = [
    {
      id: "landing",
      name: "01. Session Entry",
      icon: Users,
      count: totalPop,
      unit: "agents",
      sublabel: "Unique Simulated Customers",
      metricLabel: "100% of agents",
      rate: 100,
      dropCount: preCheckoutLoss,
      dropReason: preCheckoutLoss > 0 ? `${preCheckoutLoss} dropped pre-checkout` : null,
    },
    {
      id: "cart",
      name: "02. Cart / Intent",
      icon: ShoppingCart,
      count: cartPop,
      unit: "sessions",
      sublabel: "Checkout Initiated",
      metricLabel: `${totalPop > 0 ? ((cartPop / totalPop) * 100).toFixed(1) : "100"}% of agents`,
      rate: totalPop > 0 ? (cartPop / totalPop) * 100 : 100,
      dropCount: 0,
      dropReason: null,
    },
    {
      id: "method",
      name: "03. Rail Selection",
      icon: CreditCard,
      count: checkoutPop,
      unit: "sessions",
      sublabel: "Payment Rail Chosen",
      metricLabel: `${totalPop > 0 ? ((checkoutPop / totalPop) * 100).toFixed(1) : "100"}% of agents`,
      rate: totalPop > 0 ? (checkoutPop / totalPop) * 100 : 100,
      dropCount: 0,
      dropReason: null,
    },
    {
      id: "auth",
      name: "04. Authentication",
      icon: ShieldCheck,
      count: authAttempts,
      unit: "attempts",
      sublabel: `3DS Challenges (+${retriedCount} retries)`,
      metricLabel: `${totalPop > 0 ? (authAttempts / totalPop).toFixed(2) : "1.00"}x / agent`,
      rate: 100,
      dropCount: authLoss,
      dropReason: authLoss > 0 ? `${authLoss} auth timeout drops` : null,
    },
    {
      id: "gateway",
      name: "05. Gateway Routing",
      icon: Server,
      count: gatewayAttempts,
      unit: "attempts",
      sublabel: "Acquirer Submissions",
      metricLabel: `${authAttempts > 0 ? ((gatewayAttempts / authAttempts) * 100).toFixed(1) : "100"}% routed`,
      rate: authAttempts > 0 ? (gatewayAttempts / authAttempts) * 100 : 100,
      dropCount: declineLoss + maxRetriesLoss,
      dropReason: `${declineLoss + maxRetriesLoss} declines / exhausted retries`,
    },
  ];

  // 3 Mutually Exclusive Terminal Agent Outcomes (Sum = 1,000 agents = 100% of population)
  const terminalAgentOutcomes = [
    {
      id: "captured",
      label: "Captured / Settled",
      count: capturedCount,
      percent: captureRate,
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
      barColor: "bg-emerald-600",
      desc: "Unique agents whose orders were successfully authorized and captured.",
    },
    {
      id: "declined",
      label: "Terminal Declines",
      count: failedCount,
      percent: kpis?.failure_rate_percent ?? (totalPop > 0 ? (failedCount / totalPop) * 100 : 15.5),
      icon: AlertCircle,
      tone: "text-red-700 bg-red-50 border-red-200",
      barColor: "bg-red-600",
      desc: "Unique agents whose attempts ended in hard decline or exhausted retry budgets.",
    },
    {
      id: "abandoned",
      label: "Cart Abandonment",
      count: abandonedCount,
      percent: kpis?.abandonment_rate_percent ?? (totalPop > 0 ? (abandonedCount / totalPop) * 100 : 1.5),
      icon: UserX,
      tone: "text-textSecondary bg-canvas border-hairline",
      barColor: "bg-textTertiary",
      desc: "Unique agents who dropped off before completion due to friction or timeout.",
    },
  ];

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-4">
      {/* Header & Explanatory Copy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-textPrimary tracking-tight">
              Payment Journey Funnel Simulation
            </h2>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              {isSimulating ? "Discrete Simulation Running..." : simulationResult ? `N = ${totalPop.toLocaleString()} Calibrated Agents` : "Awaiting Execution"}
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-normal">
            Agents are unique simulated customers. Payment attempts can exceed the agent population because agents may retry or switch payment methods across the authentication and gateway routing stages.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-textTertiary">Overall Conversion:</span>
            <span className="font-semibold text-emerald-700 tabular-nums">
              {captureRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Funnel Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = selectedStageId === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => setSelectedStageId(isSelected ? null : stage.id)}
              className={cn(
                "p-3 rounded-md border transition-all text-left space-y-2 cursor-pointer select-none relative group",
                isSelected
                  ? "border-accent bg-blue-50/40 ring-1 ring-accent/20"
                  : "bg-surface border-hairline hover:border-borderStrong hover:bg-subtle/30"
              )}
            >
              {/* Top Row: Icon and Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-textPrimary truncate">
                  <Icon className="size-3.5 text-accent shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{stage.name}</span>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="size-3 text-textTertiary shrink-0 hidden md:block opacity-40 -mr-1" />
                )}
              </div>

              {/* Middle Row: Numbers & Accurate Units */}
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between text-xs">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-textPrimary tabular-nums font-mono">
                      {stage.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-textTertiary lowercase">
                      {stage.unit}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-textSecondary tabular-nums">
                    {stage.metricLabel}
                  </span>
                </div>
                <span className="text-[10px] text-textTertiary truncate block">
                  {stage.sublabel}
                </span>
              </div>

              {/* Progress retention bar */}
              <div className="h-1.5 w-full rounded-full bg-canvas overflow-hidden border border-hairline/60">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, stage.rate))}%` }}
                />
              </div>

              {/* Loss Dropout Indicator if any */}
              {stage.dropReason && (
                <div className="pt-1 border-t border-hairline text-[10px] text-red-700 flex items-center justify-between font-mono">
                  <span>Drop:</span>
                  <span className="font-semibold">-{stage.dropCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Outcomes & Payment Attempt Activity */}
      <div className="pt-3 border-t border-hairline space-y-3">
        {/* 1. Terminal Agent Outcomes (Strict Conservation: 100% of Agents) */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-medium text-textSecondary">
            <span className="uppercase tracking-wider">
              Terminal Agent Outcomes (Population Conservation: {totalPop.toLocaleString()} Unique Agents)
            </span>
            <span className="text-textTertiary font-mono text-[10px]">
              {capturedCount.toLocaleString()} Captures ({((capturedCount / totalPop) * 100).toFixed(1)}%) + {failedCount.toLocaleString()} Declines ({((failedCount / totalPop) * 100).toFixed(1)}%) + {abandonedCount.toLocaleString()} Drops ({((abandonedCount / totalPop) * 100).toFixed(1)}%) = {totalPop.toLocaleString()} Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {terminalAgentOutcomes.map((term) => {
              const Icon = term.icon;

              return (
                <div
                  key={term.id}
                  className="p-3 rounded-md border border-hairline bg-canvas/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-textPrimary">
                      <Icon className="size-3.5 shrink-0 text-textSecondary" strokeWidth={1.75} />
                      <span>{term.label}</span>
                    </div>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                        term.tone
                      )}
                    >
                      {term.percent.toFixed(1)}% of agents
                    </span>
                  </div>

                  <div className="text-base font-bold font-mono text-textPrimary tabular-nums">
                    {term.count.toLocaleString()} <span className="text-[10px] font-normal text-textTertiary">unique agents</span>
                  </div>

                  <div className="h-1 w-full rounded-full bg-hairline/60 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", term.barColor)}
                      style={{ width: `${Math.min(100, Math.max(3, term.percent))}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-textTertiary leading-normal">
                    {term.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Payment Attempt & Retry Activity (Event / Attempt Accounting) */}
        <div className="pt-2 border-t border-hairline/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-textSecondary">
            <span className="uppercase tracking-wider">
              Payment Attempt & Retry Activity (Stochastic Event Accounting)
            </span>
            <span className="text-[10px] text-textTertiary font-mono">
              Events exceed population due to retry loops & rail switches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-surface rounded-md border border-hairline overflow-hidden">
            {/* Total Attempts */}
            <div className="p-2.5 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-textTertiary font-medium uppercase tracking-wider">
                  Total Payment Attempts
                </span>
                <span className="text-[10px] font-mono text-accent font-semibold">
                  {totalPop > 0 ? (authAttempts / totalPop).toFixed(2) : "1.00"}x / agent
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
                {authAttempts.toLocaleString()} <span className="text-[10px] font-normal text-textTertiary">attempts</span>
              </div>
              <span className="text-[10px] text-textTertiary block">
                Gross auth challenges across all payment rails
              </span>
            </div>

            {/* Retry Attempts */}
            <div className="p-2.5 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-textTertiary font-medium uppercase tracking-wider">
                  Retry Attempts
                </span>
                <span className="text-[10px] font-mono text-amber-800 font-semibold">
                  {kpis ? ((kpis.retry_attempts_count / totalPop) * 100).toFixed(1) : "0"}% retry rate
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
                {retriedCount.toLocaleString()} <span className="text-[10px] font-normal text-textTertiary">retries</span>
              </div>
              <span className="text-[10px] text-textTertiary block">
                Secondary attempts initiated following initial decline
              </span>
            </div>

            {/* Method Switches */}
            <div className="p-2.5 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-textTertiary font-medium uppercase tracking-wider">
                  Method Switches
                </span>
                <span className="text-[10px] font-mono text-textSecondary font-semibold">
                  {kpis?.method_switches_count ?? 0} flipped
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-textPrimary tabular-nums">
                {(kpis?.method_switches_count ?? 0).toLocaleString()} <span className="text-[10px] font-normal text-textTertiary">switches</span>
              </div>
              <span className="text-[10px] text-textTertiary block">
                Rail switched (e.g. UPI to Card) upon bank decline
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
