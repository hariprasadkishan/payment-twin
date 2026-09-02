import React from "react";
import { useDNAProfile, useDNAStatus } from "@/hooks/useDNA";
import { useIngestPayments, useLoadBenchmark } from "@/hooks/useDatasets";
import { useAppStore } from "@/store/useAppStore";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { BehavioralFingerprint } from "./components/BehavioralFingerprint";
import { DNAInstrumentStrip } from "./components/DNAInstrumentStrip";
import { PaymentRailPerformance } from "./components/PaymentRailPerformance";
import { TransactionValueSignature } from "./components/TransactionValueSignature";
import { FailureSignature } from "./components/FailureSignature";
import { 
  Dna, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  Database,
  Cpu,
  Bot
} from "lucide-react";

export const DNAView: React.FC = () => {
  const { isLoading: isStatusLoading } = useDNAStatus();
  const { data: profile, isLoading: isProfileLoading, isError, error, refetch } = useDNAProfile();
  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();
  const { mutate: loadBenchmark, isPending: isBenchmarkLoading } = useLoadBenchmark();
  const { setActivePage } = useAppStore();

  const isLoading = isStatusLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-200 max-w-7xl mx-auto">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorAlert
          title="Failed to Load Behavioral DNA Profile"
          message={(error as Error)?.message || "An unexpected error occurred while communicating with the DNA engine."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isProfileEmpty = !profile || profile.status === "empty" || profile.provenance.total_sample_size === 0;

  if (isProfileEmpty) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-200 max-w-7xl mx-auto">
        <EmptyState
          icon={Dna}
          title="No Behavioral DNA Profile Established"
          description="Behavioral DNA requires observed payment records to calculate empirical priors, Wilson 95% confidence intervals, and log-normal amount distributions."
          statusBadge="DNA UNAVAILABLE"
          actionLabel={isIngesting ? "Syncing Test Payments..." : "Sync Test Payments from Razorpay"}
          onAction={() => triggerIngest({ count: 100 })}
          secondaryActionLabel={isBenchmarkLoading ? "Loading Benchmark..." : "Load Synthetic Benchmark (650 Records)"}
          onSecondaryAction={() => loadBenchmark()}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
            <Layers className="w-5 h-5 text-twin-cyan" />
            <h4 className="text-xs font-semibold text-twin-white">Method Priors & Shares</h4>
            <p className="text-[11px] text-twin-slate leading-relaxed">
              Measures empirical payment method selection preferences (UPI, Cards, Netbanking) conditioned on ticket size.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
            <TrendingUp className="w-5 h-5 text-twin-indigo" />
            <h4 className="text-xs font-semibold text-twin-white">Success & Failure Dynamics</h4>
            <p className="text-[11px] text-twin-slate leading-relaxed">
              Profiles capture rates per payment rail and issuing bank with Wilson score analytical confidence bounds.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
            <DollarSign className="w-5 h-5 text-twin-success" />
            <h4 className="text-xs font-semibold text-twin-white">Ticket Size & Quantiles</h4>
            <p className="text-[11px] text-twin-slate leading-relaxed">
              Estimates continuous amount distributions using Log-normal MLE fit and robust non-parametric percentiles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in-50 duration-300 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO / EDITORIAL INTELLIGENCE HEADER + PRIMARY FINGERPRINT VISUAL      */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Editorial Headline & Meta (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-twin-cyan/10 border border-twin-cyan/30 text-[10px] font-mono uppercase tracking-widest text-twin-cyan font-bold">
                <Dna className="w-3.5 h-3.5" />
                BEHAVIORAL INTELLIGENCE / PROFILE v{profile.dna_version}
              </span>
              <span className="text-[10px] font-mono text-twin-slate/70 uppercase tracking-widest">
                ID: DNA_{profile.provenance.data_source_type.substring(0, 8)}
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-twin-white tracking-tight leading-[1.08]">
                THE MERCHANT
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-twin-cyan via-twin-white to-twin-indigo">
                  PAYMENT FINGERPRINT.
                </span>
              </h1>
            </div>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-twin-slate font-light leading-relaxed max-w-xl">
              An empirical behavioral model extracted from{" "}
              <strong className="text-twin-white font-semibold">
                {profile.provenance.total_sample_size.toLocaleString()} payment records
              </strong>
              . This profile becomes the statistical prior for synthetic Customer Agents and Payment Twin simulations.
            </p>
          </div>

          {/* Live Provenance & Confidence Spec-Bar */}
          <div className="pt-4 border-t border-twin-border/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <ConfidenceGrade
                grade={profile.reliability.confidence_grade as any}
                sampleSize={profile.provenance.total_sample_size}
              />
              <ProvenanceTag provenance={profile.provenance.data_source_type as any} />
            </div>

            <div className="text-[11px] font-mono text-twin-slate/80">
              Timespan: <span className="text-twin-white font-semibold">{profile.temporal_dynamics.timespan_days ? `${profile.temporal_dynamics.timespan_days}d` : "Single Period"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Primary Fingerprint Centerpiece (5 cols) */}
        <div className="lg:col-span-5">
          <BehavioralFingerprint
            methodPriors={profile.method_priors.probabilities}
            sampleSize={profile.provenance.total_sample_size}
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. "WHAT THE DNA KNOWS" 4-DIMENSION BEHAVIORAL INSTRUMENTATION STRIP       */}
      {/* ========================================================================= */}
      <DNAInstrumentStrip profile={profile} />

      {/* ========================================================================= */}
      {/* 3. PAYMENT RAIL PERFORMANCE                                               */}
      {/* ========================================================================= */}
      <PaymentRailPerformance profile={profile} />

      {/* ========================================================================= */}
      {/* 4. TRANSACTION VALUE SIGNATURE                                            */}
      {/* ========================================================================= */}
      <TransactionValueSignature profile={profile} />

      {/* ========================================================================= */}
      {/* 5. FAILURE SIGNATURE & TRANSITION ASSOCIATIONS                           */}
      {/* ========================================================================= */}
      <FailureSignature profile={profile} />

      {/* ========================================================================= */}
      {/* 6. DNA -> SIMULATION WORKFLOW BRIDGE                                      */}
      {/* ========================================================================= */}
      <section className="rounded-xl border border-twin-cyan/40 bg-gradient-to-r from-twin-cyan/15 via-[#0B0F19] to-twin-card/70 p-6 sm:p-8 shadow-2xl shadow-twin-cyan/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-twin-cyan" />
              <h3 className="text-base sm:text-lg font-display font-bold text-twin-white uppercase tracking-wider">
                DNA READY FOR SYNTHETIC AGENTS
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-cyan/20 border border-twin-cyan/35 text-twin-cyan font-bold uppercase tracking-wider">
                CALIBRATED PRIOR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-twin-slate font-light leading-relaxed">
              These empirical priors are used to generate Customer Agents and initialize the Payment Twin simulation. The agent population samples amount, channel, retry tolerance, and checkout rails directly from this profile.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setActivePage("agents")}
            className="gap-2 font-display uppercase tracking-widest text-xs font-bold whitespace-nowrap self-start md:self-center shadow-lg shadow-twin-cyan/20"
          >
            GENERATE / INSPECT CUSTOMER AGENTS →
          </Button>
        </div>

        {/* Visual Pipeline Track */}
        <div className="pt-4 border-t border-twin-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-twin-card/60 border border-twin-border flex items-center gap-2.5">
              <Database className="w-4 h-4 text-twin-slate flex-shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] text-twin-slate uppercase font-bold block">STEP 01</span>
                <span className="text-[11px] font-semibold text-twin-white truncate block">RAW BENCHMARK</span>
                <span className="text-[9px] text-twin-success block">ACTIVE (650 records)</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-lg bg-twin-cyan/10 border border-twin-cyan/40 flex items-center gap-2.5 shadow-md shadow-twin-cyan/5">
              <Dna className="w-4 h-4 text-twin-cyan flex-shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] text-twin-cyan uppercase font-bold block">STEP 02</span>
                <span className="text-[11px] font-bold text-twin-white truncate block">BEHAVIORAL DNA</span>
                <span className="text-[9px] text-twin-cyan font-semibold block">CALIBRATED (v1.0.0)</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border/70 flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-twin-indigo flex-shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] text-twin-slate uppercase font-bold block">STEP 03</span>
                <span className="text-[11px] font-semibold text-twin-white truncate block">CUSTOMER AGENTS</span>
                <span className="text-[9px] text-twin-indigo block">DOWNSTREAM CONSUMER</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border/70 flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-twin-slate flex-shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] text-twin-slate uppercase font-bold block">STEP 04</span>
                <span className="text-[11px] font-semibold text-twin-white truncate block">PAYMENT TWIN</span>
                <span className="text-[9px] text-twin-slate block">SIMULATION ENGINE</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
