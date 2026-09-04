import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRunSimulation, useRunMonteCarlo } from "@/hooks/useSimulation";
import { useDNAStatus } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { AgentSimulationResult } from "@/types/simulation";
import { TwinScenarioHandoff } from "@/types/handoff";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

import { TwinHeader } from "./components/TwinHeader";
import { SimulationControlStrip } from "./components/SimulationControlStrip";
import { PaymentFunnelInstrument } from "./components/PaymentFunnelInstrument";
import { SimulationExecutiveSummary } from "./components/SimulationExecutiveSummary";
import { MethodPerformanceBreakdown } from "./components/MethodPerformanceBreakdown";
import { FunnelDropoffAttribution } from "./components/FunnelDropoffAttribution";
import { AgentLifecycleTraces } from "./components/AgentLifecycleTraces";
import { AgentTraceDrawer } from "./components/AgentTraceDrawer";
import { MonteCarloUncertaintyPanel } from "./components/MonteCarloUncertaintyPanel";
import { WhatIfHandoffBanner } from "./components/WhatIfHandoffBanner";
import { GuardianContextAlert } from "./components/GuardianContextAlert";
import { IntelligencePipelineIntro } from "./components/IntelligencePipelineIntro";
import { TwinReproducibilityProvenance } from "./components/TwinReproducibilityProvenance";

export const TwinView: React.FC = () => {
  const { 
    activeTwinHandoff, 
    setActiveTwinHandoff,
    setActivePage,
    setActiveTwinScenarioHandoff,
  } = useAppStore();

  const { data: dnaStatus } = useDNAStatus();

  // Primary view state: Default to operational simulation workspace
  const [viewState, setViewState] = useState<"workspace" | "intro">("workspace");

  // Mode and Control State
  const [simMode, setSimMode] = useState<"single" | "monte_carlo">("single");
  const [populationSize, setPopulationSize] = useState(1000);
  const [randomSeed, setRandomSeed] = useState(42);
  const [monteCarloRuns, setMonteCarloRuns] = useState(20);
  const [selectedAgentTrace, setSelectedAgentTrace] = useState<AgentSimulationResult | null>(null);

  // Single-run Simulation Mutation
  const {
    mutate: executeSimulation,
    isPending: isSimulatingSingle,
    data: singleResult,
    isError: isSingleError,
    error: singleError,
  } = useRunSimulation();

  // Monte Carlo Simulation Mutation
  const {
    mutate: executeMonteCarlo,
    isPending: isSimulatingMonteCarlo,
    data: monteCarloResult,
    isError: isMonteCarloError,
    error: monteCarloError,
  } = useRunMonteCarlo();

  const isSimulating = isSimulatingSingle || isSimulatingMonteCarlo;

  // Auto-run initial baseline simulation on mount if empty
  const hasAutoRun = useRef(false);
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      executeSimulation({
        population_size: 1000,
        random_seed: 42,
        preview_agent_count: 10,
      });
    }
  }, [executeSimulation]);

  const handleRun = () => {
    if (simMode === "single") {
      executeSimulation({
        population_size: populationSize,
        random_seed: randomSeed,
        preview_agent_count: 10,
      });
    } else {
      executeMonteCarlo({
        population_size: populationSize,
        monte_carlo_runs: monteCarloRuns,
        random_seed: randomSeed,
      });
    }
  };

  const handleHandoffToWhatIf = () => {
    if (!singleResult || !singleResult.kpis) return;
    const dropoffs = singleResult.funnel_dropoffs || {};
    const dropoffEntries = Object.entries(dropoffs).sort((a, b) => b[1] - a[1]);
    const [topKey, topCount] = dropoffEntries[0] || ["TERMINAL_DECLINES", singleResult.kpis.failed_transactions];
    const totalPop = singleResult.kpis.total_agents || singleResult.population_size || 1000;
    const topPercent = Number(((topCount / totalPop) * 100).toFixed(1));

    let lowestMethod: string | null = null;
    let lowestRate: number = 100;
    if (singleResult.method_breakdown) {
      Object.entries(singleResult.method_breakdown).forEach(([method, data]) => {
        if (data.success_rate_percent < lowestRate && data.attempted_count > 0) {
          lowestRate = data.success_rate_percent;
          lowestMethod = method;
        }
      });
    }

    const handoff: TwinScenarioHandoff = {
      handoff_id: `hnd_twin_${Date.now()}`,
      source_simulation_id: singleResult.simulation_id,
      top_bottleneck: topKey,
      bottleneck_count: topCount,
      bottleneck_percent: topPercent,
      lowest_performing_method: lowestMethod,
      lowest_method_rate: lowestMethod ? lowestRate : null,
      baseline_conversion_rate: singleResult.kpis.conversion_rate_percent,
      baseline_failure_rate: singleResult.kpis.failure_rate_percent,
      baseline_abandonment_rate: singleResult.kpis.abandonment_rate_percent,
      baseline_net_revenue: singleResult.kpis.net_merchant_revenue_inr,
      population_size: totalPop,
      random_seed: singleResult.random_seed,
      provenance_type: singleResult.dna_provenance_type,
    };
    setActiveTwinScenarioHandoff(handoff);
    setActivePage("scenarios");
  };

  // Top bottleneck computation for What-If banner
  const dropoffs = singleResult?.funnel_dropoffs || {};
  const dropoffEntries = Object.entries(dropoffs).sort((a, b) => b[1] - a[1]);
  const [topBottleneckKey, topBottleneckCount] = dropoffEntries[0] || [
    "TERMINAL_DECLINES",
    singleResult?.kpis?.failed_transactions ?? 0,
  ];
  const topBottleneckPercent = singleResult?.kpis?.total_agents
    ? Number(((topBottleneckCount / singleResult.kpis.total_agents) * 100).toFixed(1))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <AnimatePresence mode="wait">
        {viewState === "intro" ? (
          <motion.div
            key="twin-intro-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            <IntelligencePipelineIntro
              onEnterWorkspace={() => setViewState("workspace")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="twin-workspace-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* 1. COMPACT OPERATIONAL HEADER */}
            <TwinHeader
              reliabilityGrade={dnaStatus?.confidence_grade}
              provenanceType={dnaStatus?.provenance_type}
              baselineSampleSize={dnaStatus?.available_sample_count ?? 650}
              isSimulating={isSimulating}
              onRunSimulation={handleRun}
              hasResult={!!singleResult?.kpis}
              onHandoffToWhatIf={handleHandoffToWhatIf}
              onShowIntro={() => setViewState("intro")}
              isShowingIntro={false}
            />

            {/* 2. GUARDIAN CONTEXT ALERT (IF ARRIVED FROM GUARDIAN) */}
            {activeTwinHandoff && (
              <GuardianContextAlert
                handoff={activeTwinHandoff}
                onDismiss={() => setActiveTwinHandoff(null)}
              />
            )}

            {/* 3. SIMULATION CONTROL STRIP */}
            <SimulationControlStrip
              simMode={simMode}
              onSimModeChange={setSimMode}
              populationSize={populationSize}
              onPopulationSizeChange={setPopulationSize}
              randomSeed={randomSeed}
              onRandomSeedChange={setRandomSeed}
              monteCarloRuns={monteCarloRuns}
              onMonteCarloRunsChange={setMonteCarloRuns}
              isSimulating={isSimulating}
              onRun={handleRun}
            />

            {/* ERROR ALERTS */}
            {(isSingleError || isMonteCarloError) && (
              <ErrorAlert
                title="Simulation Execution Failed"
                message={((singleError || monteCarloError) as Error)?.message || "Failed to execute discrete simulation."}
              />
            )}

            {/* 4. PRIMARY FUNNEL VISUALIZATION INSTRUMENT (DARK SIMULATION COCKPIT) */}
            <PaymentFunnelInstrument
              simulationResult={singleResult || null}
              isSimulating={isSimulating}
              populationSize={populationSize}
            />

            {/* 5. SINGLE-RUN OUTCOMES & ATTRIBUTION */}
            {singleResult && singleResult.kpis && simMode === "single" && (
              <div className="space-y-6">
                {/* Executive Summary: Single Continuous Outcome Ribbon */}
                <SimulationExecutiveSummary
                  kpis={singleResult.kpis}
                />

                {/* 2-Column Analytical Split: Rails + Loss Attribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <MethodPerformanceBreakdown
                    methodBreakdown={singleResult.method_breakdown}
                  />
                  <FunnelDropoffAttribution
                    dropoffs={singleResult.funnel_dropoffs}
                    totalPopulation={singleResult.kpis.total_agents}
                  />
                </div>

                {/* Deterministic Reproducibility & Provenance Panel */}
                <TwinReproducibilityProvenance
                  simulationId={singleResult.simulation_id}
                  randomSeed={singleResult.random_seed}
                  populationSize={singleResult.kpis.total_agents}
                  dnaVersion="1.0.0"
                  provenanceType={singleResult.dna_provenance_type}
                  executionDurationMs={singleResult.kpis.execution_duration_ms}
                />

                {/* Contextual Workflow Bridge: What-If Studio Handoff */}
                <WhatIfHandoffBanner
                  topBottleneck={topBottleneckKey}
                  bottleneckCount={topBottleneckCount}
                  bottleneckPercent={topBottleneckPercent}
                  onHandoffToWhatIf={handleHandoffToWhatIf}
                />

                {/* Synthetic Customer Agent Lifecycle Traces Table */}
                {singleResult.preview_agent_traces && singleResult.preview_agent_traces.length > 0 && (
                  <AgentLifecycleTraces
                    traces={singleResult.preview_agent_traces}
                    onSelectTrace={setSelectedAgentTrace}
                  />
                )}
              </div>
            )}

            {/* 6. MONTE CARLO UNCERTAINTY ANALYSIS */}
            {monteCarloResult && simMode === "monte_carlo" && (
              <MonteCarloUncertaintyPanel result={monteCarloResult} />
            )}

            {/* 7. SLIDE-OVER AGENT EVENT TRACE DRAWER */}
            <AgentTraceDrawer
              trace={selectedAgentTrace}
              isOpen={!!selectedAgentTrace}
              onClose={() => setSelectedAgentTrace(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
