import React from "react";
import { AgentArchetype } from "@/types/agent";
import { Zap, Shield, RefreshCw, Crown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchetypeLegendProps {
  totalPopulation: number;
  archetypeDistribution?: Record<string, number> | null;
  selectedArchetype: AgentArchetype | "ALL" | null;
  onSelectArchetype: (arch: AgentArchetype | "ALL") => void;
}

export const ArchetypeLegend: React.FC<ArchetypeLegendProps> = ({
  totalPopulation,
  archetypeDistribution,
  selectedArchetype,
  onSelectArchetype,
}) => {
  const configs: Record<
    AgentArchetype,
    {
      name: string;
      role: string;
      icon: React.ElementType;
      color: string;
      dotTone: string;
      badgeTone: string;
      desc: string;
      traits: { label: string; value: string }[];
    }
  > = {
    FAST_CHECKOUT: {
      name: "Fast Checkout",
      role: "Speed Optimizer",
      icon: Zap,
      color: "#0284c7",
      dotTone: "bg-sky-500",
      badgeTone: "bg-sky-50 text-sky-800 border-sky-200",
      desc: "Prioritizes instant UPI checkout. Zero tolerance for 2FA delays or OTP latency; abandons after a single failure.",
      traits: [
        { label: "Primary Rail", value: "UPI (Instant)" },
        { label: "Max Retries", value: "1 Attempt" },
        { label: "Friction Sens.", value: "High (0.85)" },
      ],
    },
    PATIENT_RETRYER: {
      name: "Patient Retryer",
      role: "Cautious Transactor",
      icon: Shield,
      color: "#4f46e5",
      dotTone: "bg-indigo-600",
      badgeTone: "bg-indigo-50 text-indigo-800 border-indigo-200",
      desc: "High commitment to transaction completion. Tolerates 3DS authentication checkpoints and retries transient gateway errors.",
      traits: [
        { label: "Primary Rail", value: "Cards / Netbanking" },
        { label: "Max Retries", value: "2–3 Retries" },
        { label: "Friction Sens.", value: "Moderate (0.35)" },
      ],
    },
    METHOD_SWITCHER: {
      name: "Method Switcher",
      role: "Reluctant Retryer",
      icon: RefreshCw,
      color: "#d97706",
      dotTone: "bg-amber-600",
      badgeTone: "bg-amber-50 text-amber-800 border-amber-200",
      desc: "High willingness to switch payment rails if the primary method fails, substituting UPI with Cards or Netbanking.",
      traits: [
        { label: "Primary Rail", value: "UPI → Cards" },
        { label: "Switch Propensity", value: "85%" },
        { label: "Max Retries", value: "2 Retries" },
      ],
    },
    HIGH_TICKET: {
      name: "High Ticket",
      role: "Premium Shopper",
      icon: Crown,
      color: "#059669",
      dotTone: "bg-emerald-600",
      badgeTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      desc: "High average order value (> ₹2,500). High purchase intent, accepting card verification delays and multi-factor authentication.",
      traits: [
        { label: "Primary Rail", value: "Cards / EMI" },
        { label: "Order Size", value: "> ₹2,500" },
        { label: "Friction Sens.", value: "Low (0.25)" },
      ],
    },
  };

  const isAllActive = selectedArchetype === "ALL" || selectedArchetype === null;

  return (
    <div className="space-y-3">
      {/* Legend Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
            Behavioral Archetypes & Cohort Filters
          </span>
          <span className="text-[11px] text-textTertiary">
            (Filter matrix and audit log by archetype)
          </span>
        </div>

        {/* ALL AGENTS Filter Button */}
        <button
          type="button"
          onClick={() => onSelectArchetype("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm",
            isAllActive
              ? "bg-accent text-white border-accent font-semibold"
              : "bg-surface border-hairline text-textSecondary hover:bg-subtle hover:text-textPrimary"
          )}
        >
          <Users className="size-3.5" />
          <span>All Archetypes ({totalPopulation.toLocaleString()})</span>
        </button>
      </div>

      {/* 4 Archetype Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {(Object.keys(configs) as AgentArchetype[]).map((arch) => {
          const cfg = configs[arch];
          const Icon = cfg.icon;
          const isSelected = selectedArchetype === arch;
          const count = archetypeDistribution?.[arch] || Math.round(totalPopulation * 0.25);
          const percent = ((count / (totalPopulation || 1)) * 100).toFixed(1);

          return (
            <div
              key={arch}
              onClick={() => onSelectArchetype(arch)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between space-y-2 shadow-panel text-left select-none",
                isSelected
                  ? "border-accent bg-blue-50/40 ring-1 ring-accent/20"
                  : "bg-surface border-hairline hover:border-borderStrong hover:bg-subtle/30"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-textPrimary">
                    <span className={cn("size-2 rounded-full shrink-0", cfg.dotTone)} />
                    <Icon className="size-3.5 text-textTertiary shrink-0" />
                    <span>{cfg.name}</span>
                  </div>
                  <span className="font-semibold text-xs text-textPrimary tabular-nums">
                    {count.toLocaleString()} <span className="text-[11px] text-textTertiary font-normal">({percent}%)</span>
                  </span>
                </div>
                <div className="text-[11px] text-textTertiary font-medium mb-2">
                  {cfg.role}
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  {cfg.desc}
                </p>
              </div>

              <div className="pt-2.5 border-t border-hairline space-y-1 text-[11px]">
                {cfg.traits.map((t) => (
                  <div key={t.label} className="flex justify-between items-center text-textSecondary">
                    <span className="text-textTertiary">{t.label}:</span>
                    <span className="font-medium text-textPrimary">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

