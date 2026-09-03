import React from "react";
import { Dna, Bot, Cpu, TrendingUp, ArrowRight } from "lucide-react";

export const AgentFunnelBridge: React.FC = () => {
  const pipelineStages = [
    {
      step: "01",
      title: "Behavioral DNA",
      subtitle: "Empirical Priors",
      icon: Dna,
      description: "Learns method priors, amount quantiles, and retry rates from historical transactions.",
      metric: "650 Records",
    },
    {
      step: "02",
      title: "Customer Agents",
      subtitle: "Autonomous Actors",
      icon: Bot,
      description: "Samples synthetic agents with bounded latent parameters (patience, friction, retries).",
      metric: "1,000 Agents",
    },
    {
      step: "03",
      title: "Payment Twin",
      subtitle: "Funnel Simulation",
      icon: Cpu,
      description: "Simulates checkout funnels, bank downtime, 2FA dropoffs, and retry attempts in discrete events.",
      metric: "Monte Carlo Run",
    },
    {
      step: "04",
      title: "What-If & Pareto",
      subtitle: "Merchant Optimization",
      icon: TrendingUp,
      description: "Evaluates fee changes, retry thresholds, and smart routing to find optimal operating trade-offs.",
      metric: "Optimal Policy",
    },
  ];

  return (
    <section
      aria-label="Agent to Simulation Pipeline Bridge"
      className="rounded-lg border border-hairline bg-surface p-5 shadow-panel space-y-4"
    >
      <div className="border-b border-hairline pb-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
              Simulation Pipeline: From Behavioral DNA to Decision Engine
            </h3>
          </div>
          <p className="text-xs text-textSecondary">
            How synthetic customer agents bridge empirical merchant behaviour to forward counterfactual simulation.
          </p>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-hairline bg-canvas text-textSecondary">
          End-to-End Architecture
        </span>
      </div>

      {/* 4-Stage Connected Workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === pipelineStages.length - 1;

          return (
            <div
              key={stage.step}
              className="relative p-4 rounded-md bg-canvas/60 border border-hairline space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid size-7 place-items-center rounded bg-blue-50 text-accent border border-blue-200">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="font-mono text-[10px] text-textTertiary font-semibold">
                      Stage {stage.step}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-textSecondary px-1.5 py-0.2 rounded bg-surface border border-hairline">
                    {stage.metric}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-textPrimary tracking-tight">
                    {stage.title}
                  </h4>
                  <span className="text-[11px] font-medium text-accent block">
                    {stage.subtitle}
                  </span>
                </div>

                <p className="text-[11px] text-textSecondary leading-relaxed">
                  {stage.description}
                </p>
              </div>

              {!isLast && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-surface rounded-full p-0.5 border border-hairline shadow-xs">
                  <ArrowRight className="size-3 text-textTertiary" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
