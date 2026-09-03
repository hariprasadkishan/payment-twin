import React, { useState, useEffect, useRef } from "react";
import { useCompareScenarios } from "@/hooks/useScenarios";
import { useDNAStatus, useDNAProfile } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { ScenarioConfig, ScenarioIntervention } from "@/types/scenario";
import { ScenarioParetoHandoff } from "@/types/handoff";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

import { WhatIfHeader } from "./components/WhatIfHeader";
import { BaselineReferenceStrip } from "./components/BaselineReferenceStrip";
import { InterventionBuilder } from "./components/InterventionBuilder";
import { ScenarioPreviewBanner } from "./components/ScenarioPreviewBanner";
import { PairedResultsComparison } from "./components/PairedResultsComparison";
import { CausalAttributionTrail } from "./components/CausalAttributionTrail";
import { PaymentRailDeltasTable } from "./components/PaymentRailDeltasTable";
import { DecisionSummaryCard } from "./components/DecisionSummaryCard";
import { IncomingHandoffBanners } from "./components/IncomingHandoffBanners";

export const ScenariosView: React.FC = () => {
  const { 
    activeTwinHandoff, 
    setActiveTwinHandoff,
    activeTwinScenarioHandoff,
    setActiveTwinScenarioHandoff,
    setActiveScenarioParetoHandoff,
    setActivePage,
  } = useAppStore();

  const { data: dnaStatus } = useDNAStatus();
  const { data: dnaProfile } = useDNAProfile();

  // Baseline empirical defaults from DNA profile
  const baselineUpiRate = dnaProfile?.success_dynamics.by_method.upi?.rate ?? 0.88;
  const baselineCardRate = dnaProfile?.success_dynamics.by_method.card?.rate ?? 0.85;
  const baselineCardMdr = dnaProfile?.fee_economics.mdr_by_method_percent.card ?? 1.85;

  // Controlled Intervention Levers State
  const [upiDelta, setUpiDelta] = useState<number>(0.05); // Default +5% for immediate insight
  const [cardDelta, setCardDelta] = useState<number>(0.0);
  const [routingShift, setRoutingShift] = useState<number>(0);
  const [maxRetries, setMaxRetries] = useState<number>(2);
  const [cardMdrRate, setCardMdrRate] = useState<number>(baselineCardMdr);

  // Common Simulation Settings
  const [populationSize, setPopulationSize] = useState<number>(1000);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  // Compare Scenarios Mutation
  const {
    mutate: runComparison,
    isPending: isComparing,
    data: compareResult,
    isError,
    error,
  } = useCompareScenarios();

  // Build and execute scenario comparison
  const executeScenario = (
    uDelta = upiDelta,
    cDelta = cardDelta,
    rShift = routingShift,
    retries = maxRetries,
    mdr = cardMdrRate,
    pop = populationSize,
    seed = randomSeed
  ) => {
    const interventions: ScenarioIntervention[] = [];

    // 1. UPI Success Rate Intervention
    if (uDelta !== 0.0) {
      interventions.push({
        intervention_type: "METHOD_SUCCESS_RATE",
        target: "upi",
        mode: "DELTA",
        value: uDelta,
        description: `Shift UPI success rate by ${(uDelta * 100).toFixed(1)}%`,
      });
    }

    // 2. Card Success Rate Intervention
    if (cDelta !== 0.0) {
      interventions.push({
        intervention_type: "METHOD_SUCCESS_RATE",
        target: "card",
        mode: "DELTA",
        value: cDelta,
        description: `Shift Card success rate by ${(cDelta * 100).toFixed(1)}%`,
      });
    }

    // 3. Routing Preference Shift
    if (rShift !== 0) {
      interventions.push({
        intervention_type: "METHOD_ROUTING_PREFERENCE",
        target: rShift > 0 ? "upi" : "card",
        shift_percentage: Math.abs(rShift),
        description: `Shift ${Math.abs(rShift)}% traffic toward ${rShift > 0 ? "UPI" : "Cards"}`,
      });
    }

    // 4. Retry Policy
    if (retries !== 1) {
      interventions.push({
        intervention_type: "RETRY_POLICY",
        max_retries_override: retries,
        retry_propensity_multiplier: 1.0,
        description: `Retry policy: max ${retries} retries with standard propensity`,
      });
    }

    // 5. Card MDR Rate
    if (mdr !== baselineCardMdr) {
      interventions.push({
        intervention_type: "FEE_MDR_RATE",
        target: "card",
        value: mdr,
        description: `Card MDR rate adjusted to ${mdr.toFixed(2)}%`,
      });
    }

    // Fallback: If no changes adjusted, add default neutral intervention
    if (interventions.length === 0) {
      interventions.push({
        intervention_type: "METHOD_SUCCESS_RATE",
        target: "upi",
        mode: "DELTA",
        value: 0.03,
        description: "Explore +3% boost in UPI capture rate",
      });
    }

    const scenario: ScenarioConfig = {
      scenario_id: `scen_${Date.now()}`,
      scenario_name: "Counterfactual Policy Experiment",
      description: "User-configured What-If intervention evaluated against baseline under CRN",
      interventions,
      population_size: pop,
      random_seed: seed,
    };

    runComparison({
      scenarios: [scenario],
      population_size: pop,
      random_seed: seed,
    });
  };

  // Auto-run initial scenario comparison on mount
  const hasAutoRun = useRef(false);
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      executeScenario(0.05, 0.0, 0, 2, baselineCardMdr, 1000, 42);
    }
  }, [runComparison]);

  const handleResetToBaseline = () => {
    setUpiDelta(0.0);
    setCardDelta(0.0);
    setRoutingShift(0);
    setMaxRetries(1);
    setCardMdrRate(baselineCardMdr);
    executeScenario(0.0, 0.0, 0, 1, baselineCardMdr, populationSize, randomSeed);
  };

  const activeComparison = compareResult?.comparisons?.[0];

  const handleHandoffToPareto = () => {
    if (!activeComparison) return;
    const convComp = activeComparison.metric_comparisons["conversion_rate_percent"];
    const revComp = activeComparison.metric_comparisons["net_merchant_revenue_inr"];
    const handoff: ScenarioParetoHandoff = {
      handoff_id: `hnd_scen_${Date.now()}`,
      scenario_id: activeComparison.scenario_id,
      scenario_name: activeComparison.scenario_name,
      target_intervention: "Counterfactual Policy Intervention",
      conversion_lift_percent: convComp?.absolute_delta ?? 0,
      revenue_lift_inr: revComp?.absolute_delta ?? 0,
      baseline_conversion_rate: convComp?.baseline_value ?? 83.0,
      projected_conversion_rate: convComp?.scenario_value ?? 0,
      population_size: populationSize,
      random_seed: randomSeed,
    };
    setActiveScenarioParetoHandoff(handoff);
    setActivePage("pareto");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. COMPACT OPERATIONAL HEADER */}
      <WhatIfHeader
        reliabilityGrade={dnaStatus?.confidence_grade}
        provenanceType={dnaStatus?.provenance_type}
        baselineSampleSize={dnaStatus?.available_sample_count ?? 650}
        isComparing={isComparing}
        onRunScenario={() => executeScenario()}
        onResetToBaseline={handleResetToBaseline}
        onBackToTwin={() => setActivePage("twin")}
      />

      {/* 2. INCOMING HANDOFF CONTEXT BANNERS (TWIN / GUARDIAN) */}
      <IncomingHandoffBanners
        twinHandoff={activeTwinScenarioHandoff}
        onDismissTwinHandoff={() => setActiveTwinScenarioHandoff(null)}
        guardianHandoff={activeTwinHandoff}
        onDismissGuardianHandoff={() => setActiveTwinHandoff(null)}
      />

      {/* 3. BASELINE CONTEXT REFERENCE STRIP */}
      <BaselineReferenceStrip
        handoff={activeTwinScenarioHandoff}
        baselineKPIs={compareResult?.baseline_kpis}
        populationSize={populationSize}
        randomSeed={randomSeed}
      />

      {/* 4. INTERVENTION BUILDER (LABORATORY LEVERS) */}
      <InterventionBuilder
        upiDelta={upiDelta}
        onUpiDeltaChange={setUpiDelta}
        cardDelta={cardDelta}
        onCardDeltaChange={setCardDelta}
        routingShift={routingShift}
        onRoutingShiftChange={setRoutingShift}
        maxRetries={maxRetries}
        onMaxRetriesChange={setMaxRetries}
        cardMdrRate={cardMdrRate}
        onCardMdrRateChange={setCardMdrRate}
        populationSize={populationSize}
        onPopulationSizeChange={setPopulationSize}
        randomSeed={randomSeed}
        onRandomSeedChange={setRandomSeed}
        baselineUpiRate={baselineUpiRate}
        baselineCardRate={baselineCardRate}
        baselineCardMdr={baselineCardMdr}
      />

      {/* 5. SCENARIO PREVIEW (PRE-FLIGHT CONFIGURATION) */}
      <ScenarioPreviewBanner
        upiDelta={upiDelta}
        cardDelta={cardDelta}
        routingShift={routingShift}
        maxRetries={maxRetries}
        cardMdrRate={cardMdrRate}
        baselineUpiRate={baselineUpiRate}
        baselineCardRate={baselineCardRate}
        baselineCardMdr={baselineCardMdr}
      />

      {/* ERROR ALERTS */}
      {isError && (
        <ErrorAlert
          title="What-If Simulation Failed"
          message={(error as Error)?.message || "Failed to execute What-If scenario."}
        />
      )}

      {/* 6. PAIRED RESULTS COMPARISON */}
      {activeComparison && (
        <div className="space-y-4">
          {/* Dominant Highlight Cards + Comparative Operational Table */}
          <PairedResultsComparison
            comparison={activeComparison}
            populationSize={populationSize}
          />

          {/* Causal Attribution Mechanism Chain */}
          {activeComparison.attribution_trail && activeComparison.attribution_trail.length > 0 && (
            <CausalAttributionTrail steps={activeComparison.attribution_trail} />
          )}

          {/* Payment Rail Delta Decomposition */}
          {activeComparison.method_deltas && Object.keys(activeComparison.method_deltas).length > 0 && (
            <PaymentRailDeltasTable methodDeltas={activeComparison.method_deltas} />
          )}

          {/* Decision Synthesis & Pareto Handoff Card */}
          <DecisionSummaryCard
            comparison={activeComparison}
            onHandoffToPareto={handleHandoffToPareto}
          />
        </div>
      )}
    </div>
  );
};
