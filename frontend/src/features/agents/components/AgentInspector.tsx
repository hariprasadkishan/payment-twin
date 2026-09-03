import React from "react";
import { CustomerAgent, AgentArchetype } from "@/types/agent";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Bot, HelpCircle } from "lucide-react";

interface AgentInspectorProps {
  agent: CustomerAgent | null;
  onClose: () => void;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({ agent, onClose }) => {
  if (!agent) return null;

  const archetypeBadgeVariants: Record<AgentArchetype, "info" | "neutral" | "warning" | "success"> = {
    FAST_CHECKOUT: "info",
    PATIENT_RETRYER: "neutral",
    METHOD_SWITCHER: "warning",
    HIGH_TICKET: "success",
  };

  const retryPct = Math.round(agent.latent_parameters.retry_propensity * 100);
  const frictionPct = Math.round(agent.latent_parameters.friction_sensitivity * 100);
  const switchPct = Math.round(agent.latent_parameters.method_switch_propensity * 100);

  // Operational simulation rationale
  const getRationale = () => {
    switch (agent.archetype) {
      case "FAST_CHECKOUT":
        return `As a Fast Checkout speed optimizer, this synthetic customer prefers immediate UPI authorization. With high friction sensitivity (${frictionPct}%) and a tight ${agent.latent_parameters.patience_timeout_seconds}s timeout, any authentication latency or failure results in rapid funnel abandonment after ${agent.latent_parameters.max_retries} attempt.`;
      case "PATIENT_RETRYER":
        return `As a Patient Retryer cautious transactor, this synthetic customer exhibits high willingness to verify 2FA/OTP (${100 - frictionPct}% patience), accepting up to ${agent.latent_parameters.max_retries} sequential retries with a high retry propensity (${retryPct}%) before considering abandonment.`;
      case "METHOD_SWITCHER":
        return `As a Method Switcher reluctant retryer, this synthetic customer has a strong fallback rail propensity (${switchPct}%). If the primary rail (${agent.observed_preferences.primary_method.toUpperCase()}) fails, this agent immediately switches to secondary alternatives (${agent.observed_preferences.secondary_method?.toUpperCase() || "Cards"}).`;
      case "HIGH_TICKET":
        return `As a High Ticket premium shopper, this synthetic customer carries a large transaction order (₹${agent.observed_preferences.transaction_amount_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}) with high purchase intent, readily completing verification checkpoints and tolerating processing delays.`;
      default:
        return "Calibrated synthetic agent drawn from empirical Behavioral DNA distributions.";
    }
  };

  return (
    <Drawer
      isOpen={!!agent}
      onClose={onClose}
      title={`Agent Forensics: ${agent.agent_id}`}
      description="Calibrated autonomous payment actor sampled from Behavioral DNA"
    >
      <div className="space-y-5 text-xs">
        {/* Header Profile Card */}
        <div className="p-4 rounded-md bg-canvas border border-hairline space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-accent" strokeWidth={1.75} />
              <span className="font-semibold text-textPrimary text-sm tracking-tight">
                {agent.archetype.replace(/_/g, " ")}
              </span>
            </div>
            <Badge variant={archetypeBadgeVariants[agent.archetype] || "neutral"} size="sm" dot>
              Calibrated Actor
            </Badge>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-hairline text-textSecondary">
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Deterministic Random Seed:</span>
              <span className="font-mono text-textPrimary font-medium tabular-nums">{agent.random_seed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Current Funnel Stage:</span>
              <Badge variant="neutral" size="sm">{agent.current_state}</Badge>
            </div>
          </div>
        </div>

        {/* Behavioral Decision Scales */}
        <div className="p-4 rounded-md bg-surface border border-hairline shadow-panel space-y-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary block border-b border-hairline pb-2">
            Latent Decision Scales
          </span>

          {/* Scale 1: Retry Propensity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-textSecondary">Retry Propensity</span>
              <span className="font-semibold text-textPrimary tabular-nums">{retryPct}%</span>
            </div>
            <div className="w-full h-2 rounded bg-subtle overflow-hidden">
              <div
                className="h-full bg-accent rounded transition-all duration-300"
                style={{ width: `${retryPct}%` }}
              />
            </div>
            <span className="text-[10px] text-textTertiary">Likelihood to retry failed transaction</span>
          </div>

          {/* Scale 2: Friction Sensitivity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-textSecondary">Friction Sensitivity</span>
              <span className="font-semibold text-textPrimary tabular-nums">{frictionPct}%</span>
            </div>
            <div className="w-full h-2 rounded bg-subtle overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded transition-all duration-300"
                style={{ width: `${frictionPct}%` }}
              />
            </div>
            <span className="text-[10px] text-textTertiary">Sensitivity to latency and OTP verification steps</span>
          </div>

          {/* Scale 3: Method Switch Propensity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-textSecondary">Method Switch Propensity</span>
              <span className="font-semibold text-textPrimary tabular-nums">{switchPct}%</span>
            </div>
            <div className="w-full h-2 rounded bg-subtle overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded transition-all duration-300"
                style={{ width: `${switchPct}%` }}
              />
            </div>
            <span className="text-[10px] text-textTertiary">Willingness to try fallback payment rails</span>
          </div>
        </div>

        {/* Observed Checkout Preferences */}
        <div className="p-4 rounded-md bg-surface border border-hairline shadow-panel space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary block border-b border-hairline pb-2">
            DNA-Grounded Checkout Profile
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Primary Payment Rail:</span>
              <span className="font-semibold text-textPrimary uppercase">{agent.observed_preferences.primary_method}</span>
            </div>
            {agent.observed_preferences.secondary_method && (
              <div className="flex justify-between items-center">
                <span className="text-textTertiary">Fallback Method:</span>
                <span className="font-medium text-textSecondary uppercase">{agent.observed_preferences.secondary_method}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Basket Amount:</span>
              <span className="font-semibold text-textPrimary tabular-nums">
                ₹{agent.observed_preferences.transaction_amount_inr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Amount Tier:</span>
              <span className="text-textSecondary capitalize">{agent.observed_preferences.amount_tier.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Max Allowed Retries:</span>
              <span className="font-medium text-textPrimary tabular-nums">{agent.latent_parameters.max_retries} attempts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textTertiary">Patience Timeout:</span>
              <span className="font-medium text-textPrimary tabular-nums">{agent.latent_parameters.patience_timeout_seconds}s</span>
            </div>
          </div>
        </div>

        {/* Simulation Relevance Explanation */}
        <div className="p-4 rounded-md bg-blue-50/70 border border-blue-200 space-y-2">
          <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
            <HelpCircle className="size-4 shrink-0" />
            <span>Simulation Relevance in Payment Twin</span>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed">
            {getRationale()}
          </p>
        </div>
      </div>
    </Drawer>
  );
};

