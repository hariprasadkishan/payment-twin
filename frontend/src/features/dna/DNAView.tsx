import React from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Database,
  Dna,
  ShieldAlert,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useDNAProfile, useDNAStatus } from "@/hooks/useDNA";
import { useIngestPayments, useLoadBenchmark } from "@/hooks/useDatasets";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { DNASummaryRibbon } from "./components/DNASummaryRibbon";
import { DNAPaymentMethodSurface } from "./components/DNAPaymentMethodSurface";
import { DNAAmountDistribution } from "./components/DNAAmountDistribution";
import { DNARetryAndTemporal } from "./components/DNARetryAndTemporal";
import { DNAFailureDiagnostics } from "./components/DNAFailureDiagnostics";

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

export const DNAView: React.FC = () => {
  const { isLoading: statusLoading } = useDNAStatus();
  const {
    data: profile,
    isLoading: profileLoading,
    isError,
    error,
    refetch,
  } = useDNAProfile();
  const { mutate: ingest, isPending: ingesting } = useIngestPayments();
  const { mutate: benchmark, isPending: benchmarkLoading } = useLoadBenchmark();
  const { setActivePage } = useAppStore();

  if (statusLoading || profileLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-16 w-1/3 rounded-md" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Behavioral DNA is unavailable"
        message={(error as Error)?.message || "The empirical profile could not be loaded."}
        onRetry={() => refetch()}
      />
    );
  }

  if (
    !profile ||
    profile.status === "empty" ||
    profile.provenance.total_sample_size === 0
  ) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon={Dna}
          title="No behavioral profile yet"
          description="Behavioral DNA requires payment records to calculate empirical method priors, Wilson capture confidence intervals, ticket quantiles, and retry transition matrices."
          actionLabel={ingesting ? "Syncing payments…" : "Sync test payments"}
          onAction={() => ingest({ count: 100 })}
          secondaryActionLabel={
            benchmarkLoading ? "Loading benchmark…" : "Load synthetic benchmark"
          }
          onSecondaryAction={() => benchmark()}
        />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-2">
            <WalletCards className="size-5 text-accent" />
            <h3 className="text-sm font-semibold text-textPrimary">Payment Mix Priors</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Understand which checkout methods customers choose across varied order values.
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-2">
            <BarChart3 className="size-5 text-accent" />
            <h3 className="text-sm font-semibold text-textPrimary">Success Dynamics</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Compare capture rates with analytical 95% Wilson confidence intervals across rails.
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-2">
            <ShieldAlert className="size-5 text-accent" />
            <h3 className="text-sm font-semibold text-textPrimary">Friction Diagnostics</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Identify recurring failure sources, dropoff stages, and empirical retry behavior.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. COMPACT OPERATIONAL HEADER */}
      <section className="flex flex-col justify-between gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-textTertiary font-semibold flex items-center gap-1.5">
            <Dna className="size-3 text-accent" />
            <span>Behavioral DNA · Profile v{profile.dna_version}</span>
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-textPrimary">
            Behavioral DNA
          </h1>
          <p className="mt-1 text-xs text-textSecondary max-w-2xl leading-relaxed">
            Learned statistical priors, empirical distributions, and transition dynamics calibrated
            from {formatNumber(profile.provenance.total_sample_size)} payment records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => setActivePage("agents")}>
            <Bot className="size-3.5" />
            <span>Inspect Customer Agents</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActivePage("twin")}>
            <Sparkles className="size-3.5" />
            <span>Open Payment Twin</span>
          </Button>
        </div>
      </section>

      {/* 2. PRIMARY DNA SUMMARY RIBBON */}
      <DNASummaryRibbon profile={profile} />

      {/* 3. DOMINANT ANALYTICAL SURFACE: PAYMENT METHOD BEHAVIOUR */}
      <section aria-label="Payment Method Behavior Surface">
        <DNAPaymentMethodSurface profile={profile} />
      </section>

      {/* 4. SECONDARY ANALYTICAL SURFACE: TRANSACTION AMOUNT DISTRIBUTION */}
      <section aria-label="Transaction Value Distribution">
        <DNAAmountDistribution profile={profile} />
      </section>

      {/* 5. BEHAVIOUR PATTERNS & RETRY DYNAMICS */}
      <section aria-label="Retry Dynamics and Temporal Priors">
        <DNARetryAndTemporal profile={profile} />
      </section>

      {/* 6. FAILURE & FRICTION DIAGNOSTICS */}
      <section aria-label="Failure Diagnostics">
        <DNAFailureDiagnostics profile={profile} />
      </section>

      {/* 7. "WHY THIS MATTERS" / PAYMENT TWIN HANDOFF BRIDGE */}
      <section className="rounded-lg border border-hairline bg-surface p-6 sm:p-8 shadow-panel flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-accent ring-1 ring-blue-100">
            <Database className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-textPrimary tracking-tight">
                Empirical Priors Ready for Simulation
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-50 text-semantic-success font-semibold border border-emerald-200">
                Calibrated
              </span>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              Customer Agents sample checkout patience, ticket size, rail preference, and friction
              tolerance directly from these learned distributions. Test fee interventions and routing
              policies in Payment Twin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" size="md" onClick={() => setActivePage("twin")}>
            <span>Simulate in Payment Twin</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};
