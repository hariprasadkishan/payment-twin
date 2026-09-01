import React from "react";
import { useDNAProfile, useDNAStatus } from "@/hooks/useDNA";
import { useIngestPayments } from "@/hooks/useDatasets";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { DistributionBar, MethodShareItem } from "@/components/domain/DistributionBar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { 
  Dna, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  AlertOctagon
} from "lucide-react";

export const DNAView: React.FC = () => {
  const { isLoading: isStatusLoading } = useDNAStatus();
  const { data: profile, isLoading: isProfileLoading, isError, error, refetch } = useDNAProfile();
  const { mutate: triggerIngest, isPending: isIngesting } = useIngestPayments();

  const isLoading = isStatusLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Failed to Load Behavioral DNA Profile"
        message={(error as Error)?.message || "An unexpected error occurred while communicating with the DNA engine."}
        onRetry={() => refetch()}
      />
    );
  }

  const isProfileEmpty = !profile || profile.status === "empty" || profile.provenance.total_sample_size === 0;

  if (isProfileEmpty) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-200">
        <EmptyState
          icon={Dna}
          title="No Behavioral DNA Profile Established"
          description="Behavioral DNA requires observed payment records to calculate empirical priors, Wilson 95% confidence intervals, and log-normal amount distributions."
          statusBadge="DNA UNAVAILABLE"
          actionLabel={isIngesting ? "Syncing Test Payments..." : "Sync Test Payments from Razorpay"}
          onAction={() => triggerIngest({ count: 100 })}
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

  // Method items for distribution bar
  const methodColors: Record<string, string> = {
    upi: "#06B6D4",
    card: "#6366F1",
    netbanking: "#F59E0B",
    wallet: "#10B981",
    emi: "#EC4899",
  };

  const methodItems: MethodShareItem[] = Object.entries(profile.method_priors.probabilities).map(
    ([method, prob]) => ({
      key: method,
      label: method.toUpperCase(),
      percentage: prob * 100,
      color: methodColors[method.toLowerCase()] || "#94A3B8",
    })
  );

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* DNA Profile Header Meta */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-twin-cyan" />
            <h2 className="text-base font-display font-bold text-twin-white tracking-tight">
              Merchant Behavioral DNA Fingerprint
            </h2>
            <Badge variant="cyan" size="sm">v{profile.dna_version}</Badge>
          </div>
          <p className="text-xs text-twin-slate">
            Empirically extracted from {profile.provenance.total_sample_size.toLocaleString()} observed payment records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceGrade
            grade={profile.reliability.confidence_grade as any}
            sampleSize={profile.provenance.total_sample_size}
          />
          <ProvenanceTag provenance={profile.provenance.data_source_type as any} />
        </div>
      </div>

      {/* Grid: Method Priors & Success Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Priors Card */}
        <Card variant="primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-twin-cyan" />
              1. Payment Instrument Priors & Routing
            </CardTitle>
            <CardDescription>
              Marginal selection probabilities P(method = m) and ticket size conditioning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DistributionBar items={methodItems} />

            {/* Amount Conditioned Priors Breakdown */}
            {profile.method_priors.amount_conditioned_priors && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
                  Amount-Conditioned Selection Probabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {Object.entries(profile.method_priors.amount_conditioned_priors).map(([tier, priors]) => (
                    <div key={tier} className="p-3 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                      <span className="text-[10px] text-twin-slate uppercase font-bold">
                        {tier.replace("tier_", "").replace(/_/g, " ")}
                      </span>
                      {Object.entries(priors).map(([m, p]) => (
                        <div key={m} className="flex justify-between text-[11px]">
                          <span className="text-twin-slate">{m}:</span>
                          <span className="text-twin-white font-semibold">{(p * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Dynamics Card */}
        <Card variant="primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-twin-success" />
              2. Capture Rates & Wilson 95% Error Bounds
            </CardTitle>
            <CardDescription>
              Empirical capture rates per rail and issuing bank with analytical confidence intervals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {Object.entries(profile.success_dynamics.by_method).map(([method, metric]) => (
                <div key={method} className="p-3 rounded-lg bg-twin-card/50 border border-twin-border flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: methodColors[method] || "#94A3B8" }} />
                    <span className="font-semibold text-twin-white uppercase">{method}</span>
                    <span className="text-twin-slate text-[10px]">({metric.sample_size} attempts)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-twin-white font-bold">
                      {(metric.rate * 100).toFixed(1)}%
                    </span>
                    {metric.ci_95 && (
                      <span className="text-[10px] text-twin-slate">
                        [{(metric.ci_95[0] * 100).toFixed(1)}% - {(metric.ci_95[1] * 100).toFixed(1)}%]
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Issuing Bank Success Breakdown */}
            {profile.success_dynamics.by_bank && Object.keys(profile.success_dynamics.by_bank).length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
                  Issuing Bank Performance
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {Object.entries(profile.success_dynamics.by_bank).map(([bank, metric]) => (
                    <div key={bank} className="p-2.5 rounded-lg bg-twin-card/40 border border-twin-border flex justify-between">
                      <span className="text-twin-slate">{bank}:</span>
                      <span className="text-twin-white font-semibold">{(metric.rate * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Amount Distribution & Failure Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Amount Distribution Card */}
        <Card variant="primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-twin-cyan" />
              3. Ticket Size Distribution & Quantiles
            </CardTitle>
            <CardDescription>
              Parametric Log-normal fit and empirical percentile markers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.amount_distribution.summary && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
                <div className="p-2.5 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                  <span className="text-[10px] text-twin-slate">Mean</span>
                  <div className="font-bold text-twin-white">₹{profile.amount_distribution.summary.mean.toFixed(0)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                  <span className="text-[10px] text-twin-slate">Median</span>
                  <div className="font-bold text-twin-cyan">₹{profile.amount_distribution.summary.median.toFixed(0)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                  <span className="text-[10px] text-twin-slate">Std Dev</span>
                  <div className="font-bold text-twin-white">₹{profile.amount_distribution.summary.std_dev.toFixed(0)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                  <span className="text-[10px] text-twin-slate">IQR</span>
                  <div className="font-bold text-twin-white">₹{profile.amount_distribution.summary.iqr.toFixed(0)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-twin-card/50 border border-twin-border space-y-1">
                  <span className="text-[10px] text-twin-slate">Skewness</span>
                  <div className="font-bold text-twin-white">{profile.amount_distribution.summary.skewness.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Quantiles Grid */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
                Empirical Quantiles (Percentiles)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-xs font-mono text-center">
                {Object.entries(profile.amount_distribution.quantiles).map(([q, val]) => (
                  <div key={q} className="p-2 rounded bg-twin-card/40 border border-twin-border/60">
                    <span className="text-[10px] text-twin-slate uppercase">{q}</span>
                    <div className="font-semibold text-twin-white">₹{val.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parametric Fit Status */}
            {profile.amount_distribution.parametric_fit && (
              <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border text-xs flex items-center justify-between font-mono">
                <span className="text-twin-slate">Lognormal MLE Fit:</span>
                <span className={profile.amount_distribution.parametric_fit.is_adequate_fit ? "text-twin-success" : "text-twin-warning"}>
                  {profile.amount_distribution.parametric_fit.is_adequate_fit ? "Adequate Fit (p >= 0.05)" : "Empirical Non-parametric Fallback"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failure Diagnostics Card */}
        <Card variant="primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-twin-danger" />
              4. Failure Diagnostics & Transitions
            </CardTitle>
            <CardDescription>
              Attributed failure sources and empirical retry transition rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
                Error Source Attribution
              </span>
              <div className="space-y-1.5">
                {Object.entries(profile.failure_diagnostics.error_source_distribution).map(([src, share]) => (
                  <div key={src} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-twin-card/40 border border-twin-border/60">
                    <span className="text-twin-slate capitalize">{src}:</span>
                    <span className="text-twin-danger font-bold">{(share * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Retry Transition Stats */}
            <div className="p-4 rounded-lg bg-twin-card/50 border border-twin-border space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-twin-slate">Retry Propensity on Failure:</span>
                <span className="text-twin-white font-semibold">
                  {profile.empirical_transitions.overall_retry_probability_on_failure !== null
                    ? `${((profile.empirical_transitions.overall_retry_probability_on_failure ?? 0) * 100).toFixed(1)}%`
                    : "Unobserved"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-twin-slate">Method Switch on Retry:</span>
                <span className="text-twin-cyan font-semibold">
                  {profile.empirical_transitions.method_switch_on_retry_probability !== null
                    ? `${((profile.empirical_transitions.method_switch_on_retry_probability ?? 0) * 100).toFixed(1)}%`
                    : "Unobserved"}
                </span>
              </div>
              <p className="text-[10px] text-twin-slate/70 pt-1 border-t border-twin-border/40">
                {profile.empirical_transitions.unobserved_dropouts_note}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
