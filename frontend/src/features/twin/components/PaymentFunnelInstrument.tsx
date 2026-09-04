import React, { useState, useEffect, useRef } from "react";
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
  Users,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

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
  // Staged computation progression: 0 to 5 stages
  const [resolvedStageCount, setResolvedStageCount] = useState<number>(5);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers
  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // When a new simulation starts, sequence the computational progression across funnel stages
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isSimulating) {
      clearTimers();
      if (prefersReducedMotion) {
        setResolvedStageCount(5);
        return;
      }

      setResolvedStageCount(0);

      // Staggered computational resolution
      const t1 = setTimeout(() => setResolvedStageCount(1), 200);
      const t2 = setTimeout(() => setResolvedStageCount(2), 450);
      const t3 = setTimeout(() => setResolvedStageCount(3), 750);
      const t4 = setTimeout(() => setResolvedStageCount(4), 1050);
      const t5 = setTimeout(() => setResolvedStageCount(5), 1350);

      timerRef.current = [t1, t2, t3, t4, t5];
    } else {
      // If simulation finished or initial load, ensure fully settled
      setResolvedStageCount(5);
    }
  }, [isSimulating]);

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
      stageIndex: 0,
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
      stageIndex: 1,
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
      stageIndex: 2,
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
      stageIndex: 3,
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
      stageIndex: 4,
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
      cardStyle: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
      numStyle: "text-emerald-300",
      pillStyle: "bg-emerald-900/60 text-emerald-300 border-emerald-500/40",
      barColor: "bg-emerald-500",
      desc: "Unique agents whose orders were successfully authorized and captured.",
    },
    {
      id: "declined",
      label: "Terminal Declines",
      count: failedCount,
      percent: kpis?.failure_rate_percent ?? (totalPop > 0 ? (failedCount / totalPop) * 100 : 15.5),
      icon: AlertCircle,
      cardStyle: "bg-rose-950/40 border-rose-500/30 text-rose-300",
      numStyle: "text-rose-300",
      pillStyle: "bg-rose-900/60 text-rose-300 border-rose-500/40",
      barColor: "bg-rose-500",
      desc: "Unique agents whose attempts ended in hard decline or exhausted retry budgets.",
    },
    {
      id: "abandoned",
      label: "Cart Abandonment",
      count: abandonedCount,
      percent: kpis?.abandonment_rate_percent ?? (totalPop > 0 ? (abandonedCount / totalPop) * 100 : 1.5),
      icon: UserX,
      cardStyle: "bg-slate-800/40 border-slate-700/60 text-slate-300",
      numStyle: "text-slate-200",
      pillStyle: "bg-slate-800 text-slate-300 border-slate-700",
      barColor: "bg-slate-400",
      desc: "Unique agents who dropped off before completion due to friction or timeout.",
    },
  ];

  return (
    <section
      aria-label="Payment Twin Discrete Funnel Simulator Cockpit"
      className="rounded-xl border border-slate-800 bg-[#0B1222] p-4 sm:p-6 shadow-2xl text-slate-100 space-y-5 select-none"
    >
      {/* Header & Explanatory Copy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">
              Payment Journey Funnel Simulation
            </h2>
            <span
              className={cn(
                "text-[10px] font-mono font-medium px-2 py-0.5 rounded border transition-colors",
                resolvedStageCount < 5
                  ? "border-blue-400/40 bg-blue-950/60 text-blue-300 flex items-center gap-1.5"
                  : "border-slate-700 bg-slate-800/60 text-slate-300"
              )}
            >
              {resolvedStageCount < 5 ? (
                <>
                  <Loader2 className="size-2.5 animate-spin text-blue-400" />
                  <span>Computing Stage {resolvedStageCount + 1} of 5...</span>
                </>
              ) : (
                `N = ${totalPop.toLocaleString()} Calibrated Agents`
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-normal max-w-2xl">
            Agents are unique simulated customers. Payment attempts exceed agent volume because agents retry or switch payment methods across the authentication and gateway routing stages.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 self-start sm:self-center">
          <div className="flex items-center gap-2 font-mono text-xs bg-slate-900/80 px-3 py-1.5 rounded-md border border-slate-800">
            <span className="text-slate-400">Simulated Conversion:</span>
            <span className="font-bold text-emerald-400 tabular-nums text-sm">
              {resolvedStageCount >= 5 ? (
                <AnimatedNumber value={captureRate} suffix="%" decimals={1} />
              ) : (
                <span className="text-slate-500 text-xs">Simulating...</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Funnel Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = selectedStageId === stage.id;
          const isResolved = resolvedStageCount > stage.stageIndex;
          const isCurrent = resolvedStageCount === stage.stageIndex;

          return (
            <div
              key={stage.id}
              onClick={() => setSelectedStageId(isSelected ? null : stage.id)}
              className={cn(
                "p-3.5 rounded-lg border transition-all text-left space-y-2.5 cursor-pointer relative group",
                isSelected
                  ? "border-blue-500 bg-blue-950/50 ring-1 ring-blue-500/40"
                  : isCurrent
                  ? "border-blue-400/80 bg-blue-950/30 ring-1 ring-blue-400/30 shadow-lg animate-pulse"
                  : isResolved
                  ? "bg-[#111A2E] border-slate-800/90 hover:border-slate-700 hover:bg-[#15223C]"
                  : "bg-slate-900/40 border-slate-800/40 opacity-50"
              )}
            >
              {/* Top Row: Icon and Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 truncate">
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      isCurrent ? "text-blue-400 animate-pulse" : "text-blue-400"
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{stage.name}</span>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="size-3 text-slate-600 shrink-0 hidden md:block -mr-1" />
                )}
              </div>

              {/* Middle Row: Numbers & Accurate Units */}
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between text-xs">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-100 tabular-nums font-mono">
                      {isResolved ? (
                        <AnimatedNumber value={stage.count} />
                      ) : isCurrent ? (
                        <span className="text-blue-400 text-xs">Simulating...</span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 lowercase">
                      {stage.unit}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 tabular-nums">
                    {isResolved ? stage.metricLabel : ""}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  {stage.sublabel}
                </span>
              </div>

              {/* Progress retention bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/40">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isCurrent ? "bg-blue-400 animate-pulse" : "bg-blue-500"
                  )}
                  style={{
                    width: isResolved
                      ? `${Math.min(100, Math.max(5, stage.rate))}%`
                      : isCurrent
                      ? "40%"
                      : "0%",
                  }}
                />
              </div>

              {/* Loss Dropout Indicator if any */}
              {stage.dropReason && isResolved && (
                <div className="pt-1.5 border-t border-slate-800 text-[10px] text-rose-400 flex items-center justify-between font-mono">
                  <span>Drop:</span>
                  <span className="font-semibold">-{stage.dropCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Outcomes & Payment Attempt Activity */}
      <div className="pt-3 border-t border-slate-800 space-y-4">
        {/* 1. Terminal Agent Outcomes (Strict Conservation: 100% of Agents) */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-medium text-slate-300">
            <span className="uppercase tracking-wider">
              Terminal Agent Outcomes (Population Conservation: {totalPop.toLocaleString()} Unique Agents)
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {capturedCount.toLocaleString()} Captures ({((capturedCount / totalPop) * 100).toFixed(1)}%) + {failedCount.toLocaleString()} Declines ({((failedCount / totalPop) * 100).toFixed(1)}%) + {abandonedCount.toLocaleString()} Drops ({((abandonedCount / totalPop) * 100).toFixed(1)}%) = {totalPop.toLocaleString()} Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {terminalAgentOutcomes.map((term) => {
              const Icon = term.icon;
              const isResolved = resolvedStageCount >= 5;

              return (
                <div
                  key={term.id}
                  className={cn(
                    "p-3.5 rounded-lg border space-y-2",
                    term.cardStyle
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                      <span>{term.label}</span>
                    </div>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                        term.pillStyle
                      )}
                    >
                      {isResolved ? (
                        <AnimatedNumber value={term.percent} suffix="% of agents" decimals={1} />
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className={cn("text-lg font-bold font-mono tabular-nums", term.numStyle)}>
                    {isResolved ? (
                      <>
                        <AnimatedNumber value={term.count} />{" "}
                        <span className="text-[10px] font-normal opacity-70">unique agents</span>
                      </>
                    ) : (
                      <span className="opacity-50 text-xs">Computing...</span>
                    )}
                  </div>

                  <div className="h-1 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", term.barColor)}
                      style={{ width: isResolved ? `${Math.min(100, Math.max(3, term.percent))}%` : "0%" }}
                    />
                  </div>

                  <p className="text-[10px] opacity-75 leading-normal">
                    {term.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Payment Attempt & Retry Activity (Event / Attempt Accounting) */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
            <span className="uppercase tracking-wider">
              Payment Attempt & Retry Activity (Stochastic Event Accounting)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Events exceed population due to retry loops & rail switches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-[#111A2E] rounded-lg border border-slate-800 overflow-hidden">
            {/* Total Attempts */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Total Payment Attempts
                </span>
                <span className="text-[10px] font-mono text-blue-400 font-semibold">
                  {totalPop > 0 ? (authAttempts / totalPop).toFixed(2) : "1.00"}x / agent
                </span>
              </div>
              <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                {resolvedStageCount >= 5 ? (
                  <>
                    <AnimatedNumber value={authAttempts} />{" "}
                    <span className="text-[10px] font-normal text-slate-400">attempts</span>
                  </>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Gross auth challenges across all payment rails
              </span>
            </div>

            {/* Retry Attempts */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Retry Attempts
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold">
                  {kpis ? ((kpis.retry_attempts_count / totalPop) * 100).toFixed(1) : "0"}% retry rate
                </span>
              </div>
              <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                {resolvedStageCount >= 5 ? (
                  <>
                    <AnimatedNumber value={retriedCount} />{" "}
                    <span className="text-[10px] font-normal text-slate-400">retries</span>
                  </>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Secondary attempts initiated following initial decline
              </span>
            </div>

            {/* Method Switches */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Method Switches
                </span>
                <span className="text-[10px] font-mono text-slate-300 font-semibold">
                  {kpis?.method_switches_count ?? 0} flipped
                </span>
              </div>
              <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                {resolvedStageCount >= 5 ? (
                  <>
                    <AnimatedNumber value={kpis?.method_switches_count ?? 0} />{" "}
                    <span className="text-[10px] font-normal text-slate-400">switches</span>
                  </>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Rail switched (e.g. UPI to Card) upon bank decline
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
