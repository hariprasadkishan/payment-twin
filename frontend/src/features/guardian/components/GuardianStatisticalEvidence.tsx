import React, { useState } from "react";
import { Sliders, ChevronDown, ChevronUp } from "lucide-react";

export const GuardianStatisticalEvidence: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const methodologies = [
    {
      title: "Population Stability Index (PSI)",
      detector: "PSI_CATEGORICAL",
      purpose: "Macro drift in multinomial payment method market share (UPI, Card, Netbanking, Wallet).",
      formula: "PSI = Σ (Actual% - Expected%) × ln(Actual% / Expected%)",
      criteria: "PSI < 0.10: Stable · 0.10 - 0.25: Moderate Shift · > 0.25: Significant Structural Drift",
      activeInEngine: "Monitors payment_method_distribution (Observed: 0.0098 → STABLE)",
    },
    {
      title: "Two-Proportion Z-Test & Fisher Exact",
      detector: "TWO_PROPORTION_ZTEST / FISHER_EXACT",
      purpose: "Asymptotic normal & hypergeometric tests evaluating capture conversion shifts across rails and issuing banks.",
      formula: "Z = (p̂₁ - p̂₂) / √[p̂(1 - p̂)(1/n₁ + 1/n₂)]",
      criteria: "Requires p < 0.05 (FDR adjusted) AND |Δ| > 2.0% commercial effect size threshold.",
      activeInEngine: "Monitors overall, UPI, Card, Netbanking, Wallet, HDFC, ICICI routes",
    },
    {
      title: "Two-Sample Kolmogorov-Smirnov (KS)",
      detector: "TWO_SAMPLE_KS",
      purpose: "Non-parametric distance comparison over complete continuous transaction ticket (AOV) distributions.",
      formula: "D = sup_x |F₁(x) - F₂(x)|",
      criteria: "Detects non-linear shifts in basket size, discounting, or cart size migration.",
      activeInEngine: "Monitors transaction_amount_distribution against lognormal baseline",
    },
    {
      title: "Tabular Cumulative Sum (CUSUM)",
      detector: "CUSUM_SHIFT",
      purpose: "Sequential change-point detection for early warning of subtle, persistent failure rate increases.",
      formula: "S_t = max(0, S_{t-1} + (X_t - μ₀ - k))",
      criteria: "Flags sustained small increases before threshold-based alerts breach.",
      activeInEngine: "Monitors sequential_failure_rate_shift across sub-windows",
    },
    {
      title: "Benjamini-Hochberg FDR Control",
      detector: "MULTIPLE TESTING CORRECTION",
      purpose: "Controls the False Discovery Rate across 10 concurrent statistical hypothesis tests.",
      formula: "p_(i) ≤ (i / m) × α  where m=10, α=0.05",
      criteria: "Eliminates spurious false positives arising from multiple simultaneous surveillance streams.",
      activeInEngine: "Enforces dual-gate: Statistical Significance ∩ Practical Commercial Impact",
    },
  ];

  return (
    <section
      aria-label="Guardian Statistical Methodology and Evidence Criteria"
      className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
              Surveillance Methodology & Dual-Gate Criteria
            </h3>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
              Rigorous Mathematical Basis
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Payment Guardian applies dual-gate testing: statistical significance requires Benjamini-Hochberg FDR correction and commercial effect size thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline self-start sm:self-center"
        >
          <span>{isExpanded ? "Collapse Methodology" : "View Mathematical Detectors"}</span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {/* Progressive Disclosure Content */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {methodologies.map((m) => (
            <div
              key={m.detector}
              className="p-3.5 rounded-md bg-canvas/60 border border-hairline space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-textPrimary text-xs">{m.title}</h4>
                <span className="font-mono text-[9px] text-textTertiary px-1 py-0.2 rounded bg-surface border border-hairline">
                  {m.detector}
                </span>
              </div>
              <p className="text-textSecondary text-xs leading-relaxed">{m.purpose}</p>
              <div className="p-2 rounded bg-surface border border-hairline/80 font-mono text-[10px] text-textPrimary">
                {m.formula}
              </div>
              <p className="text-[11px] text-textTertiary">{m.criteria}</p>
              <div className="text-[10px] font-mono text-accent pt-0.5">
                ● Active: {m.activeInEngine}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
