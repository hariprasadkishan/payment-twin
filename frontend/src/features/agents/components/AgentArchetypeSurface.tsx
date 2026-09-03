import React, { useState } from "react";
import { AgentArchetype } from "@/types/agent";
import { Zap, Shield, RefreshCw, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentArchetypeSurfaceProps {
  totalPopulation: number;
  archetypeDistribution?: Record<string, number> | null;
  selectedArchetype: AgentArchetype | "ALL" | null;
  onSelectArchetype: (arch: AgentArchetype) => void;
}

interface ArchetypeMeta {
  key: AgentArchetype;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  badgeTone: string;
  desc: string;
  primaryRail: string;
  maxRetries: string;
  retryPropensity: string;
  switchPropensity: string;
  frictionSensitivity: string;
  patienceTimeout: string;
}

const ARCHETYPE_CONFIGS: Record<AgentArchetype, ArchetypeMeta> = {
  FAST_CHECKOUT: {
    key: "FAST_CHECKOUT",
    name: "Fast Checkout",
    role: "Speed Optimizer",
    icon: Zap,
    color: "#0284c7",
    badgeTone: "bg-sky-50 text-sky-800 border-sky-200",
    desc: "Optimizes for instant 1-click execution. Zero tolerance for latency or multi-step verification; drops out after a single failed attempt.",
    primaryRail: "UPI (Instant)",
    maxRetries: "1 Attempt",
    retryPropensity: "40.9% (Low)",
    switchPropensity: "19.4% (Low)",
    frictionSensitivity: "0.77 (High)",
    patienceTimeout: "~22.0s",
  },
  PATIENT_RETRYER: {
    key: "PATIENT_RETRYER",
    name: "Patient Retryer",
    role: "Cautious Transactor",
    icon: Shield,
    color: "#4f46e5",
    badgeTone: "bg-indigo-50 text-indigo-800 border-indigo-200",
    desc: "High purchase commitment. Readily completes 2FA authentication checkpoints and retries transient gateway drops 2–3 times on the same rail.",
    primaryRail: "Cards / Netbanking / UPI",
    maxRetries: "2–3 Retries",
    retryPropensity: "67.5% (High)",
    switchPropensity: "22.7% (Moderate)",
    frictionSensitivity: "0.25 (Low)",
    patienceTimeout: "~70.0s",
  },
  METHOD_SWITCHER: {
    key: "METHOD_SWITCHER",
    name: "Method Switcher",
    role: "Reluctant Retryer",
    icon: RefreshCw,
    color: "#d97706",
    badgeTone: "bg-amber-50 text-amber-800 border-amber-200",
    desc: "Refuses to retry a failed bank rail. On drop or error, immediately switches from primary method to an alternate rail (e.g. Netbanking to UPI).",
    primaryRail: "Netbanking / Cards → UPI",
    maxRetries: "2 Retries (Across Rails)",
    retryPropensity: "56.2% (Moderate)",
    switchPropensity: "65.0%+ (Very High)",
    frictionSensitivity: "0.40 (Moderate)",
    patienceTimeout: "~45.0s",
  },
  HIGH_TICKET: {
    key: "HIGH_TICKET",
    name: "High Ticket",
    role: "Premium Shopper",
    icon: Crown,
    color: "#059669",
    badgeTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    desc: "Carries high-value cart orders (>₹2,500). High purchase intent, accepts extensive fraud security checks and bank OTP redirections.",
    primaryRail: "Cards (Credit) / Netbanking",
    maxRetries: "2 Retries",
    retryPropensity: "54.0% (Moderate)",
    switchPropensity: "23.8% (Moderate)",
    frictionSensitivity: "0.31 (Low)",
    patienceTimeout: "~90.0s",
  },
};

const formatNumber = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

const formatPercent = (n?: number | null, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

export const AgentArchetypeSurface: React.FC<AgentArchetypeSurfaceProps> = ({
  totalPopulation,
  archetypeDistribution,
  selectedArchetype,
  onSelectArchetype,
}) => {
  const [viewMode, setViewMode] = useState<"traits" | "comparison">("traits");

  const archetypes: AgentArchetype[] = [
    "FAST_CHECKOUT",
    "PATIENT_RETRYER",
    "METHOD_SWITCHER",
    "HIGH_TICKET",
  ];

  // Derive counts & percentages
  const getCount = (arch: AgentArchetype) => archetypeDistribution?.[arch] ?? 0;
  const getShare = (arch: AgentArchetype) => {
    const c = getCount(arch);
    return totalPopulation > 0 ? c / totalPopulation : 0.25;
  };

  const activeArchetypeKey =
    selectedArchetype && selectedArchetype !== "ALL"
      ? selectedArchetype
      : "FAST_CHECKOUT";

  return (
    <section
      aria-label="Dominant Archetype Analytical Surface"
      className="rounded-lg border border-hairline bg-surface shadow-panel overflow-hidden"
    >
      {/* Surface Header */}
      <div className="p-4 sm:p-5 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-textPrimary tracking-tight">
              Synthetic Archetype Distribution & Proportions
            </h2>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
              n={formatNumber(totalPopulation)} Calibrated Agents
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Discrete customer cohorts sampled from Behavioral DNA distributions to simulate checkout decisions.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex rounded-md border border-hairline bg-canvas p-0.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode("traits")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              viewMode === "traits"
                ? "bg-surface text-textPrimary shadow-sm font-semibold"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            Archetype Profiles & Traits
          </button>
          <button
            type="button"
            onClick={() => setViewMode("comparison")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              viewMode === "comparison"
                ? "bg-surface text-textPrimary shadow-sm font-semibold"
                : "text-textSecondary hover:text-textPrimary"
            )}
          >
            Comparison Matrix
          </button>
        </div>
      </div>

      {/* Aggregate Proportional Distribution Bar */}
      <div className="p-4 sm:p-5 border-b border-hairline bg-canvas/40 space-y-3">
        <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-subtle">
          {archetypes.map((arch) => {
            const share = getShare(arch);
            const meta = ARCHETYPE_CONFIGS[arch];
            return (
              <div
                key={arch}
                style={{
                  width: `${share * 100}%`,
                  backgroundColor: meta.color,
                }}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                title={`${meta.name}: ${formatPercent(share)}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          {archetypes.map((arch) => {
            const meta = ARCHETYPE_CONFIGS[arch];
            const share = getShare(arch);
            const count = getCount(arch);
            const isSelected = activeArchetypeKey === arch;

            return (
              <button
                key={arch}
                type="button"
                onClick={() => onSelectArchetype(arch)}
                className={cn(
                  "flex items-center gap-2 transition-opacity text-left",
                  isSelected ? "opacity-100 font-semibold" : "opacity-75 hover:opacity-100"
                )}
              >
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-textPrimary">{meta.name}</span>
                <span className="font-mono text-textSecondary tabular-nums">
                  {formatPercent(share)} ({formatNumber(count)})
                </span>
                {isSelected && (
                  <span className="text-[10px] font-mono text-accent">● Active</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Body */}
      {viewMode === "traits" ? (
        /* Profiles & Traits Mode */
        <div className="divide-y divide-hairline">
          {archetypes.map((arch) => {
            const meta = ARCHETYPE_CONFIGS[arch];
            const count = getCount(arch);
            const share = getShare(arch);
            const Icon = meta.icon;
            const isSelected = activeArchetypeKey === arch;

            return (
              <div
                key={arch}
                onClick={() => onSelectArchetype(arch)}
                className={cn(
                  "p-4 sm:p-5 transition-colors cursor-pointer",
                  isSelected
                    ? "bg-blue-50/40 border-l-4 border-l-accent"
                    : "hover:bg-canvas/50 border-l-4 border-l-transparent"
                )}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left: Archetype ID & Persona (5 cols) */}
                  <div className="md:col-span-5 flex items-start gap-3.5">
                    <div
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-white font-semibold shadow-sm"
                      style={{ backgroundColor: meta.color }}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-textPrimary tracking-tight">
                          {meta.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border",
                            meta.badgeTone
                          )}
                        >
                          {meta.role}
                        </span>
                      </div>
                      <p className="text-xs text-textSecondary leading-relaxed line-clamp-2">
                        {meta.desc}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Population Share (3 cols) */}
                  <div className="md:col-span-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-textSecondary">Population Share:</span>
                      <span className="font-mono font-bold text-textPrimary tabular-nums">
                        {formatPercent(share)} ({formatNumber(count)})
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${share * 100}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-textTertiary block">
                      Primary: {meta.primaryRail}
                    </span>
                  </div>

                  {/* Right: Key Behavioral Signals & Action (4 cols) */}
                  <div className="md:col-span-4 flex items-center justify-between gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-hairline/60">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="text-[10px] text-textTertiary uppercase font-mono block">
                          Retry Limit
                        </span>
                        <span className="font-mono font-semibold text-textPrimary text-xs">
                          {meta.maxRetries}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-textTertiary uppercase font-mono block">
                          Friction Sens.
                        </span>
                        <span className="font-mono font-semibold text-textPrimary text-xs">
                          {meta.frictionSensitivity}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArchetype(arch);
                      }}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded border transition-colors shrink-0",
                        isSelected
                          ? "bg-accent text-white border-accent shadow-xs flex items-center gap-1"
                          : "bg-surface text-textSecondary border-hairline hover:border-textTertiary hover:text-textPrimary"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Inspect</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Archetype Comparison Matrix Mode */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-hairline bg-canvas/60 text-[11px] font-mono text-textSecondary">
                <th className="py-3 px-4 font-semibold">Archetype</th>
                <th className="py-3 px-4 font-semibold">Share</th>
                <th className="py-3 px-4 font-semibold">Primary Rail</th>
                <th className="py-3 px-4 font-semibold">Max Retries</th>
                <th className="py-3 px-4 font-semibold">P(Retry)</th>
                <th className="py-3 px-4 font-semibold">P(Switch)</th>
                <th className="py-3 px-4 font-semibold">Friction Sens.</th>
                <th className="py-3 px-4 font-semibold">Patience Timeout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {archetypes.map((arch) => {
                const meta = ARCHETYPE_CONFIGS[arch];
                const share = getShare(arch);
                const count = getCount(arch);
                const isSelected = activeArchetypeKey === arch;

                return (
                  <tr
                    key={arch}
                    onClick={() => onSelectArchetype(arch)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected ? "bg-blue-50/50 font-medium" : "hover:bg-canvas/40"
                    )}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div>
                          <span className="font-bold text-textPrimary block">
                            {meta.name}
                          </span>
                          <span className="text-[10px] text-textTertiary">
                            {meta.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary">
                      {formatPercent(share)}{" "}
                      <span className="text-textTertiary">({formatNumber(count)})</span>
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary">
                      {meta.primaryRail}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary">
                      {meta.maxRetries}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary">
                      {meta.retryPropensity}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary">
                      {meta.switchPropensity}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary">
                      {meta.frictionSensitivity}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-textPrimary">
                      {meta.patienceTimeout}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
