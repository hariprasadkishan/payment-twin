import React from "react";
import { AgentArchetype } from "@/types/agent";
import { Sliders, GitFork, AlertCircle, ArrowRight, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentFingerprintAndDecisionsProps {
  selectedArchetype: AgentArchetype;
}

interface FingerprintParameter {
  label: string;
  mathSymbol: string;
  value: number; // 0 to 1 scale
  displayValue: string;
  level: string;
  levelTone: string;
  description: string;
}

interface DecisionStep {
  stepNumber: string;
  title: string;
  icon: React.ElementType;
  condition: string;
  action: string;
  outcome: string;
  tone: string;
}

export const AgentFingerprintAndDecisions: React.FC<AgentFingerprintAndDecisionsProps> = ({
  selectedArchetype,
}) => {
  // Data-driven parameter configs based on archetype
  const getParameters = (arch: AgentArchetype): FingerprintParameter[] => {
    switch (arch) {
      case "FAST_CHECKOUT":
        return [
          {
            label: "Retry Propensity",
            mathSymbol: "P_retry",
            value: 0.4088,
            displayValue: "0.41",
            level: "Low",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Low willingness to re-attempt after failure; drops off promptly.",
          },
          {
            label: "Method Switch Propensity",
            mathSymbol: "P_switch",
            value: 0.194,
            displayValue: "0.19",
            level: "Low",
            levelTone: "bg-slate-50 text-slate-700 border-slate-200",
            description: "Prefers aborting over typing credentials into an alternate payment rail.",
          },
          {
            label: "Friction Sensitivity",
            mathSymbol: "γ_friction",
            value: 0.7667,
            displayValue: "0.77",
            level: "High",
            levelTone: "bg-amber-50 text-amber-800 border-amber-200",
            description: "Highly sensitive to OTP delays, multiple redirects, or slow bank servers.",
          },
          {
            label: "Patience Timeout",
            mathSymbol: "τ_timeout",
            value: 0.22, // 22s out of 100s scale
            displayValue: "22.0s",
            level: "Tight",
            levelTone: "bg-rose-50 text-rose-800 border-rose-200",
            description: "Maximum elapsed duration tolerated during payment processing.",
          },
          {
            label: "Max Retry Ceiling",
            mathSymbol: "K_max",
            value: 0.33, // 1 out of 3 scale
            displayValue: "1 Attempt",
            level: "Strict",
            levelTone: "bg-slate-50 text-slate-700 border-slate-200",
            description: "Absolute ceiling on consecutive retry attempts before termination.",
          },
        ];

      case "PATIENT_RETRYER":
        return [
          {
            label: "Retry Propensity",
            mathSymbol: "P_retry",
            value: 0.6748,
            displayValue: "0.67",
            level: "High",
            levelTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
            description: "Strong willingness to re-enter OTP or re-trigger verification after a drop.",
          },
          {
            label: "Method Switch Propensity",
            mathSymbol: "P_switch",
            value: 0.227,
            displayValue: "0.23",
            level: "Moderate",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Prefers retrying the same primary instrument before switching rails.",
          },
          {
            label: "Friction Sensitivity",
            mathSymbol: "γ_friction",
            value: 0.2499,
            displayValue: "0.25",
            level: "Low",
            levelTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
            description: "High tolerance for 3DS verification, SMS OTP delays, and redirects.",
          },
          {
            label: "Patience Timeout",
            mathSymbol: "τ_timeout",
            value: 0.7, // 70s out of 100s scale
            displayValue: "70.0s",
            level: "Patient",
            levelTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
            description: "Generous window allowing for delayed bank authorization webhooks.",
          },
          {
            label: "Max Retry Ceiling",
            mathSymbol: "K_max",
            value: 0.85, // 2-3 out of 3 scale
            displayValue: "2–3 Retries",
            level: "High",
            levelTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
            description: "Will attempt payment up to 3 times before abandoning transaction.",
          },
        ];

      case "METHOD_SWITCHER":
        return [
          {
            label: "Retry Propensity",
            mathSymbol: "P_retry",
            value: 0.562,
            displayValue: "0.56",
            level: "Moderate",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Willing to retry, but specifically conditioned on shifting payment rail.",
          },
          {
            label: "Method Switch Propensity",
            mathSymbol: "P_switch",
            value: 0.68,
            displayValue: "0.68",
            level: "Very High",
            levelTone: "bg-amber-50 text-amber-800 border-amber-200",
            description: "Strong preference to discard failing method and fallback to instant UPI.",
          },
          {
            label: "Friction Sensitivity",
            mathSymbol: "γ_friction",
            value: 0.4,
            displayValue: "0.40",
            level: "Moderate",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Tolerates standard checkout friction, but flags bank downtime immediately.",
          },
          {
            label: "Patience Timeout",
            mathSymbol: "τ_timeout",
            value: 0.45,
            displayValue: "45.0s",
            level: "Moderate",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Reasonable timeout duration prior to initiating alternative rail flow.",
          },
          {
            label: "Max Retry Ceiling",
            mathSymbol: "K_max",
            value: 0.66,
            displayValue: "2 Retries",
            level: "Standard",
            levelTone: "bg-slate-50 text-slate-700 border-slate-200",
            description: "Up to 2 multi-rail attempts across primary and fallback instruments.",
          },
        ];

      case "HIGH_TICKET":
        return [
          {
            label: "Retry Propensity",
            mathSymbol: "P_retry",
            value: 0.5401,
            displayValue: "0.54",
            level: "Moderate",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Persistent intent driven by high basket value and cart commitment.",
          },
          {
            label: "Method Switch Propensity",
            mathSymbol: "P_switch",
            value: 0.2376,
            displayValue: "0.24",
            level: "Moderate",
            levelTone: "bg-blue-50 text-accent border-blue-200",
            description: "Prefers premium card/corporate accounts; switches only when necessary.",
          },
          {
            label: "Friction Sensitivity",
            mathSymbol: "γ_friction",
            value: 0.3072,
            displayValue: "0.31",
            level: "Low-Mod",
            levelTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
            description: "Expects multi-factor authentication for large INR orders; tolerates steps.",
          },
          {
            label: "Patience Timeout",
            mathSymbol: "τ_timeout",
            value: 0.9,
            displayValue: "90.0s",
            level: "High",
            levelTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
            description: "Longest tolerance window for high-value authorization clearance.",
          },
          {
            label: "Max Retry Ceiling",
            mathSymbol: "K_max",
            value: 0.66,
            displayValue: "2 Retries",
            level: "Standard",
            levelTone: "bg-slate-50 text-slate-700 border-slate-200",
            description: "2 deliberate attempts with card limits or bank portal validation.",
          },
        ];
    }
  };

  const getDecisionSteps = (arch: AgentArchetype): DecisionStep[] => {
    switch (arch) {
      case "FAST_CHECKOUT":
        return [
          {
            stepNumber: "01",
            title: "Checkout Ingress",
            icon: ShieldCheck,
            condition: "Order basket created",
            action: "Selects instant UPI rail (PhonePe/GPay) for zero-click authentication.",
            outcome: "Attempts immediate authorization",
            tone: "text-accent",
          },
          {
            stepNumber: "02",
            title: "Friction & Latency Gate",
            icon: Clock,
            condition: "Network latency > 22s or bank OTP delay",
            action: "Friction threshold (0.77) breached. Client timeout fires.",
            outcome: "Abandons checkout immediately",
            tone: "text-semantic-error",
          },
          {
            stepNumber: "03",
            title: "Failure Response",
            icon: RefreshCw,
            condition: "Authentication fails (Incorrect MPIN)",
            action: "Low retry propensity (0.41) and K_max = 1. No secondary rail attempt.",
            outcome: "Drops out without retrying",
            tone: "text-textTertiary",
          },
          {
            stepNumber: "04",
            title: "Simulated Outcome",
            icon: ArrowRight,
            condition: "Terminal resolution in Payment Twin",
            action: "Fast capture when bank rails are healthy; fast drop on degraded rails.",
            outcome: "High velocity, low recovery",
            tone: "text-textPrimary",
          },
        ];

      case "PATIENT_RETRYER":
        return [
          {
            stepNumber: "01",
            title: "Checkout Ingress",
            icon: ShieldCheck,
            condition: "Order basket created",
            action: "Selects primary card or UPI method with deliberate intent.",
            outcome: "Initiates 2FA checkout flow",
            tone: "text-accent",
          },
          {
            stepNumber: "02",
            title: "Friction & Latency Gate",
            icon: Clock,
            condition: "3DS redirect or OTP delivery delay",
            action: "High patience (70s) and low friction sensitivity (0.25). Waits calmly.",
            outcome: "Completes verification window",
            tone: "text-semantic-success",
          },
          {
            stepNumber: "03",
            title: "Failure Response",
            icon: RefreshCw,
            condition: "Bank error (Timeout or Insufficient Funds)",
            action: "High retry propensity (0.67). Re-triggers OTP attempt up to 3 times.",
            outcome: "Recovers 68% of transient drops",
            tone: "text-accent",
          },
          {
            stepNumber: "04",
            title: "Simulated Outcome",
            icon: ArrowRight,
            condition: "Terminal resolution in Payment Twin",
            action: "Maximizes capture conversion across intermittent bank server spikes.",
            outcome: "High recovery & capture rate",
            tone: "text-semantic-success",
          },
        ];

      case "METHOD_SWITCHER":
        return [
          {
            stepNumber: "01",
            title: "Checkout Ingress",
            icon: ShieldCheck,
            condition: "Order basket created",
            action: "Selects primary netbanking or card method for order payment.",
            outcome: "Enters bank payment gateway",
            tone: "text-accent",
          },
          {
            stepNumber: "02",
            title: "Friction & Latency Gate",
            icon: Clock,
            condition: "Bank portal latency > 45s",
            action: "Moderate friction sensitivity (0.40). Flags gateway sluggishness.",
            outcome: "Prepares alternate rail trigger",
            tone: "text-semantic-warning",
          },
          {
            stepNumber: "03",
            title: "Failure Response",
            icon: RefreshCw,
            condition: "Bank server down or authorization declined",
            action: "Very high switch propensity (0.68). Switches immediately to UPI.",
            outcome: "Bypasses failing bank rail",
            tone: "text-accent",
          },
          {
            stepNumber: "04",
            title: "Simulated Outcome",
            icon: ArrowRight,
            condition: "Terminal resolution in Payment Twin",
            action: "Transforms bank-origin failures into alternative rail conversions.",
            outcome: "Resilient cross-rail recovery",
            tone: "text-semantic-success",
          },
        ];

      case "HIGH_TICKET":
        return [
          {
            stepNumber: "01",
            title: "Checkout Ingress",
            icon: ShieldCheck,
            condition: "High-value cart order (>₹2,500)",
            action: "Selects premium credit card or corporate netbanking with high purchase intent.",
            outcome: "Initiates large order transaction",
            tone: "text-accent",
          },
          {
            stepNumber: "02",
            title: "Friction & Latency Gate",
            icon: Clock,
            condition: "Mandatory 3DS bank challenge & OTP",
            action: "Longest patience window (90s). Willingly completes security protocols.",
            outcome: "Clears fraud verification",
            tone: "text-semantic-success",
          },
          {
            stepNumber: "03",
            title: "Failure Response",
            icon: RefreshCw,
            condition: "Card limit exceeded or 3DS timeout",
            action: "Moderate retry (0.54) with K_max = 2. Retries with updated credentials.",
            outcome: "Protects high merchant revenue",
            tone: "text-accent",
          },
          {
            stepNumber: "04",
            title: "Simulated Outcome",
            icon: ArrowRight,
            condition: "Terminal resolution in Payment Twin",
            action: "Drives top-line gross transaction volume in simulation engine.",
            outcome: "High financial impact per capture",
            tone: "text-semantic-success",
          },
        ];
    }
  };

  const params = getParameters(selectedArchetype);
  const decisionSteps = getDecisionSteps(selectedArchetype);
  const archetypeTitle = selectedArchetype.replace(/_/g, " ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ========================================================================= */}
      {/* Left Column: Latent Parameter Fingerprint (6 cols)                       */}
      {/* ========================================================================= */}
      <section
        aria-label="Latent Parameter Fingerprint"
        className="lg:col-span-6 rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-4"
      >
        <div className="border-b border-hairline pb-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-accent" strokeWidth={1.75} />
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                Behavioral Fingerprint: {archetypeTitle}
              </h3>
            </div>
            <p className="text-xs text-textSecondary">
              Calibrated latent parameters governing autonomous agent state transitions.
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            Model Weights
          </span>
        </div>

        {/* Parameter Instruments */}
        <div className="space-y-3.5 divide-y divide-hairline/60">
          {params.map((param) => (
            <div key={param.label} className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-textPrimary">{param.label}</span>
                  <span className="text-[10px] font-mono text-textTertiary">
                    [{param.mathSymbol}]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border",
                      param.levelTone
                    )}
                  >
                    {param.level}
                  </span>
                  <span className="font-mono font-bold text-xs text-textPrimary tabular-nums">
                    {param.displayValue}
                  </span>
                </div>
              </div>

              {/* Range Scale */}
              <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${param.value * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-textSecondary leading-normal">
                {param.description}
              </p>
            </div>
          ))}
        </div>

        {/* Statistical Honesty Notice */}
        <div className="pt-3 border-t border-hairline flex items-start gap-2 text-[11px] text-textTertiary bg-canvas/60 p-2.5 rounded">
          <AlertCircle className="size-3.5 text-textTertiary shrink-0 mt-0.5" />
          <span>
            These latent mathematical weights govern agent state transitions within the simulation engine. They do not represent real individual customers.
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* Right Column: Checkout Decision Pathway (6 cols)                         */}
      {/* ========================================================================= */}
      <section
        aria-label="Checkout Decision Pathway"
        className="lg:col-span-6 rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-4"
      >
        <div className="border-b border-hairline pb-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <GitFork className="size-4 text-accent" strokeWidth={1.75} />
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                Checkout Decision Pathway: {archetypeTitle}
              </h3>
            </div>
            <p className="text-xs text-textSecondary">
              How this archetype responds to latency, friction, and gateway errors during simulation.
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
            State Flow
          </span>
        </div>

        {/* 4-Step Operational Pathway */}
        <div className="space-y-3">
          {decisionSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.stepNumber}
                className="p-3 rounded-md bg-canvas/50 border border-hairline space-y-1.5 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-accent bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Phase {step.stepNumber}
                    </span>
                    <span className="font-bold text-textPrimary">{step.title}</span>
                  </div>
                  <Icon className={cn("size-3.5", step.tone)} />
                </div>

                <p className="text-xs text-textSecondary leading-relaxed">
                  {step.action}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] border-t border-hairline/60">
                  <span className="text-textTertiary font-mono text-[10px]">
                    Trigger: {step.condition}
                  </span>
                  <span className={cn("font-medium text-[11px]", step.tone)}>
                    → {step.outcome}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
