import React from "react";
import { 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Bot, 
  PlayCircle, 
  Sliders, 
  Compass, 
  Activity,
  Cpu,
  CheckCircle2 
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDatasetSummary, useIngestPayments, useLoadBenchmark } from "@/hooks/useDatasets";
import { useDNAStatus } from "@/hooks/useDNA";
import { useGuardianStatus } from "@/hooks/useGuardian";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { LoopAnimation } from "@/components/ui/LoopAnimation";
import { TextRoll } from "@/components/ui/TextRoll";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { DistributionBar, MethodShareItem } from "@/components/domain/DistributionBar";
import { CanvasCrowdBase } from "@/components/ui/CanvasCrowdBase";

export const OverviewView: React.FC = () => {
  const { setActivePage } = useAppStore();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useDatasetSummary();

  const { data: dnaStatus, isLoading: isDnaLoading } = useDNAStatus();
  const { data: guardianStatus } = useGuardianStatus();

  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: isBenchmarkLoading } = useLoadBenchmark();

  const isLoading = isSummaryLoading && isDnaLoading;

  const hasData = (dnaStatus && dnaStatus.profiling_available) || (summary && summary.total_records > 0);
  const isBenchmark = dnaStatus?.provenance_type === "SYNTHETIC_BENCHMARK_DATA";
  const sampleCount = dnaStatus?.available_sample_count || summary?.total_records || 0;

  // Transform method distribution into items for DistributionBar
  const methodItems: MethodShareItem[] = React.useMemo(() => {
    if (!summary || !summary.method_distribution || summary.total_records === 0) return [];

    const total = summary.total_records;
    const colors: Record<string, string> = {
      upi: "#06B6D4",        // Cyan
      card: "#6366F1",       // Indigo
      netbanking: "#F59E0B", // Amber
      wallet: "#10B981",     // Emerald
      emi: "#EC4899",        // Pink
    };

    return Object.entries(summary.method_distribution).map(([method, count]) => ({
      key: method,
      label: method.toUpperCase(),
      percentage: (count / total) * 100,
      color: colors[method.toLowerCase()] || "#94A3B8",
    }));
  }, [summary]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isSummaryError && !dnaStatus) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorAlert
          title="Telemetry Feed Error"
          message={(summaryError as Error)?.message || "Failed to communicate with the intelligence backend."}
          onRetry={() => refetchSummary()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in-50 duration-300 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. HERO / EDITORIAL INTELLIGENCE LAB HEADER                                */}
      {/* ========================================================================= */}
      <section className="relative rounded-2xl border border-twin-border/90 bg-gradient-to-b from-[#0C1220] via-[#090D17] to-[#070A11] p-8 md:p-10 overflow-hidden shadow-2xl">
        {/* Subtle decorative grid backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
        
        {/* Ambient glow in corners */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-twin-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-twin-indigo/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Editorial Headline & Engine Thesis */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <LoopAnimation
                status={hasData ? "active" : "idle"}
                label={hasData ? "INTELLIGENCE ENGINE ACTIVE" : "ENGINE AWAITING DATA"}
              />
              {isBenchmark && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border border-twin-warning/30 bg-twin-warning/10 text-twin-warning font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  SYNTHETIC BENCHMARK ({sampleCount.toLocaleString()} RECORDS)
                </span>
              )}
              {hasData && !isBenchmark && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border border-twin-cyan/30 bg-twin-cyan/10 text-twin-cyan font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  OBSERVED RAZORPAY TELEMETRY
                </span>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-extrabold text-twin-white tracking-tight leading-[1.08]">
                SIMULATE WHAT <br />
                <span className="bg-gradient-to-r from-twin-cyan via-twin-indigo to-twin-white bg-clip-text text-transparent">
                  YOUR PAYMENTS
                </span> <br />
                COULD BECOME.
              </h1>
              <p className="text-sm md:text-base text-twin-slate max-w-xl leading-relaxed font-sans">
                Payment Twin learns empirical transaction dynamics from payment records, models autonomous Customer Agents, and tests counterfactual routing interventions before production deployment.
              </p>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setActivePage("twin")}
                className="gap-2 font-display tracking-wide"
              >
                <PlayCircle className="w-4 h-4" />
                Launch Payment Twin Simulator
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setActivePage("scenarios")}
                className="gap-2"
              >
                <Sliders className="w-4 h-4 text-twin-indigo" />
                What-If Studio
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setActivePage("pareto")}
                className="gap-2 text-twin-slate hover:text-twin-white"
              >
                <Compass className="w-4 h-4 text-twin-cyan" />
                Pareto Frontier →
              </Button>
            </div>
          </div>

          {/* Right Column: Live Crowd Engine Preview */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-xl border border-twin-border/80 bg-[#080B12]/90 backdrop-blur-md p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-twin-border/60 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-twin-white font-semibold">
                  <Activity className="w-4 h-4 text-twin-cyan animate-pulse" />
                  <span>VIRTUAL AGENT FUNNEL</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-card border border-twin-border text-twin-cyan font-semibold">
                  {hasData ? "LIVE SIMULATION READY" : "CALIBRATION STANDBY"}
                </span>
              </div>

              {/* High-Performance Canvas Crowd Particle Engine Preview */}
              <div className="relative h-44 rounded-lg overflow-hidden border border-twin-border/50 bg-[#05070D]">
                <CanvasCrowdBase
                  particleCount={hasData ? 75 : 25}
                  width={460}
                  height={176}
                  isSimulating={true}
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-twin-slate/80 bg-twin-bg/80 backdrop-blur-sm px-2 py-1 rounded border border-twin-border/40">
                  <span>P(Method | Ticket Size)</span>
                  <span className="text-twin-cyan font-medium">Deterministic Markov Chain</span>
                </div>
              </div>

              {/* Status summary below canvas */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-twin-card/40 border border-twin-border/60 space-y-0.5">
                  <span className="text-[10px] text-twin-slate">Sample Population:</span>
                  <div className="text-sm font-bold text-twin-white flex items-center gap-1">
                    {hasData ? (
                      <>
                        <AnimatedNumber value={sampleCount} />
                        <span className="text-[10px] font-normal text-twin-slate">orders</span>
                      </>
                    ) : (
                      "0 records"
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-twin-card/40 border border-twin-border/60 space-y-0.5">
                  <span className="text-[10px] text-twin-slate">Confidence Grade:</span>
                  <div className="text-sm font-bold text-twin-cyan">
                    {dnaStatus ? dnaStatus.confidence_grade : "UNAVAILABLE"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE 5-STAGE INTELLIGENCE PIPELINE (Sequential Architecture Flow)       */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xs font-mono font-bold tracking-widest text-twin-slate uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-twin-cyan" />
              End-to-End Intelligence Pipeline
            </h2>
            <p className="text-xs text-twin-slate">
              How observed transaction telemetry is transformed into actionable Pareto optimization.
            </p>
          </div>
          <span className="text-[11px] font-mono text-twin-slate/70 hidden sm:block">
            5 SEQUENTIAL STAGES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Stage 01: Behavioral DNA */}
          <div
            onClick={() => setActivePage("dna")}
            className="group relative p-5 rounded-xl border border-twin-border/80 bg-[#0C101B]/80 hover:bg-[#0F1424] hover:border-twin-cyan/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-twin-cyan px-2 py-0.5 rounded bg-twin-cyan/10 border border-twin-cyan/20">
                01
              </span>
              <Layers className="w-4 h-4 text-twin-cyan group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-twin-white group-hover:text-twin-cyan transition-colors">
                <TextRoll>Behavioral DNA</TextRoll>
              </h3>
              <p className="text-[11px] text-twin-slate leading-relaxed pt-1">
                Learn empirical method priors, Wilson 95% CIs, and failure diagnostics.
              </p>
            </div>
            <div className="text-[10px] font-mono text-twin-slate/80 flex items-center gap-1 group-hover:text-twin-cyan transition-colors pt-1">
              <span>View Profile</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 02: Customer Agents */}
          <div
            onClick={() => setActivePage("agents")}
            className="group relative p-5 rounded-xl border border-twin-border/80 bg-[#0C101B]/80 hover:bg-[#0F1424] hover:border-twin-indigo/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-twin-indigo px-2 py-0.5 rounded bg-twin-indigo/10 border border-twin-indigo/20">
                02
              </span>
              <Bot className="w-4 h-4 text-twin-indigo group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-twin-white group-hover:text-twin-indigo transition-colors">
                <TextRoll>Customer Agents</TextRoll>
              </h3>
              <p className="text-[11px] text-twin-slate leading-relaxed pt-1">
                Synthesize calibrated archetype populations with latent friction traits.
              </p>
            </div>
            <div className="text-[10px] font-mono text-twin-slate/80 flex items-center gap-1 group-hover:text-twin-indigo transition-colors pt-1">
              <span>Generate Studio</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 03: Payment Twin */}
          <div
            onClick={() => setActivePage("twin")}
            className="group relative p-5 rounded-xl border border-twin-cyan/30 bg-gradient-to-b from-[#0F1626] to-[#0A0E1A] hover:border-twin-cyan/60 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-lg shadow-twin-cyan/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-twin-cyan px-2 py-0.5 rounded bg-twin-cyan/20 border border-twin-cyan/30">
                03 HERO
              </span>
              <PlayCircle className="w-4 h-4 text-twin-cyan group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-twin-white group-hover:text-twin-cyan transition-colors">
                <TextRoll>Payment Twin</TextRoll>
              </h3>
              <p className="text-[11px] text-twin-slate leading-relaxed pt-1">
                Simulate 2D particle funnel journeys, multi-attempt retries & latency.
              </p>
            </div>
            <div className="text-[10px] font-mono text-twin-cyan font-semibold flex items-center gap-1 group-hover:underline pt-1">
              <span>Run Funnel Simulator</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 04: What-If Studio */}
          <div
            onClick={() => setActivePage("scenarios")}
            className="group relative p-5 rounded-xl border border-twin-border/80 bg-[#0C101B]/80 hover:bg-[#0F1424] hover:border-twin-indigo/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-twin-indigo px-2 py-0.5 rounded bg-twin-indigo/10 border border-twin-indigo/20">
                04
              </span>
              <Sliders className="w-4 h-4 text-twin-indigo group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-twin-white group-hover:text-twin-indigo transition-colors">
                <TextRoll>What-If Studio</TextRoll>
              </h3>
              <p className="text-[11px] text-twin-slate leading-relaxed pt-1">
                Test counterfactual levers with paired Common Random Numbers (CRN).
              </p>
            </div>
            <div className="text-[10px] font-mono text-twin-slate/80 flex items-center gap-1 group-hover:text-twin-indigo transition-colors pt-1">
              <span>Run Counterfactual</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 05: Pareto Explorer */}
          <div
            onClick={() => setActivePage("pareto")}
            className="group relative p-5 rounded-xl border border-twin-border/80 bg-[#0C101B]/80 hover:bg-[#0F1424] hover:border-twin-cyan/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-twin-cyan px-2 py-0.5 rounded bg-twin-cyan/10 border border-twin-cyan/20">
                05
              </span>
              <Compass className="w-4 h-4 text-twin-cyan group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-twin-white group-hover:text-twin-cyan transition-colors">
                <TextRoll>Pareto Frontier</TextRoll>
              </h3>
              <p className="text-[11px] text-twin-slate leading-relaxed pt-1">
                Discover non-dominated trade-offs balancing revenue, conversion & fees.
              </p>
            </div>
            <div className="text-[10px] font-mono text-twin-slate/80 flex items-center gap-1 group-hover:text-twin-cyan transition-colors pt-1">
              <span>Explore Trade-offs</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TELEMETRY FOUNDATION & GUARDIAN SURVEILLANCE LAYER                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Empirical Instrument Mix & Financial Health */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-twin-border bg-[#0B0F19]/90 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-twin-cyan/10 border border-twin-cyan/20 text-twin-cyan">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-twin-white">
                    Empirical Payment Instrument Mix
                  </h3>
                  <p className="text-xs text-twin-slate">
                    Observed payment method distribution across {sampleCount.toLocaleString()} transactions
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActivePage("dna")} className="text-xs text-twin-cyan">
                Full Profile →
              </Button>
            </div>

            {hasData ? (
              <div className="space-y-6">
                <DistributionBar items={methodItems} />

                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                    <span className="text-twin-slate">Total Volume:</span>
                    <div className="text-sm font-bold text-twin-white">
                      ₹{summary?.financial_metrics?.total_amount_inr?.toLocaleString("en-IN", { minimumFractionDigits: 0 }) || "0"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                    <span className="text-twin-slate">Overall Capture:</span>
                    <div className="text-sm font-bold text-twin-success flex items-baseline gap-0.5">
                      <AnimatedNumber value={summary?.status_metrics?.success_rate_percent || 0} decimals={1} />%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                    <span className="text-twin-slate">Average Ticket:</span>
                    <div className="text-sm font-bold text-twin-white">
                      ₹{summary?.financial_metrics?.average_amount_inr?.toFixed(0) || "0"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-twin-border/50 bg-twin-card/30 text-center space-y-4">
                <p className="text-xs text-twin-slate max-w-md mx-auto leading-relaxed">
                  No payment records currently loaded. Connect Razorpay Test Mode or load the synthetic benchmark dataset to calibrate Behavioral DNA.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isBenchmarkLoading}
                    onClick={() => loadBenchmark()}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-twin-warning" />
                    Load Synthetic Benchmark (650 Records)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isIngesting}
                    onClick={() => triggerIngest({ count: 100 })}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Test Payments
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Guardian Sentinel Statistical Drift Layer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-twin-border bg-[#0B0F19]/90 backdrop-blur-md flex flex-col justify-between space-y-6 h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-twin-slate uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-twin-cyan" />
                  <span>Payment Guardian Sentinel</span>
                </div>
                <Badge variant={guardianStatus?.guardian_available ? "cyan" : "neutral"} size="sm">
                  {guardianStatus?.guardian_available ? "SURVEILLANCE ACTIVE" : "MONITORING STANDBY"}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-display font-bold text-twin-white">
                  Statistical Drift & Telemetry Guard
                </h3>
                <p className="text-xs text-twin-slate leading-relaxed">
                  Monitors population shifts in capture rates and bank errors using Benjamini-Hochberg FDR control and sends triage context directly to the Twin.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border/60 text-xs font-mono space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">System Sentinel Health:</span>
                  <span className="text-twin-success font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    SYSTEM NOMINAL
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">Active Anomaly Alerts:</span>
                  <span className="text-sm font-bold text-twin-white">
                    {guardianStatus?.active_alerts_count ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">Statistical Drift Test:</span>
                  <span className="text-twin-cyan">Two-Proportion Z + PSI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-twin-slate">Twin Handoff Pipe:</span>
                  <span className="text-twin-indigo">GuardianTwinHandoff Ready</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage("guardian")}
              className="w-full gap-2"
            >
              Open Guardian Sentinel Cockpit →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
