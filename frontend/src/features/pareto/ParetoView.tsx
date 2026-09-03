import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParetoOptimization } from "@/hooks/useOptimization";
import { useDNAStatus } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { 
  ObjectiveType,
  MerchantConstraint, 
  OptimizationRequest, 
  ParetoScenarioItem,
  InfeasibleScenarioItem 
} from "@/types/optimization";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

import { ParetoHeader } from "./components/ParetoHeader";
import { OptimizationObjectivesStrip } from "./components/OptimizationObjectivesStrip";
import { ConstraintsAndSearchSpace } from "./components/ConstraintsAndSearchSpace";
import { OptimizationSummaryStrip } from "./components/OptimizationSummaryStrip";
import { ParetoFrontierChart } from "./components/ParetoFrontierChart";
import { FrontierCandidatesTable } from "./components/FrontierCandidatesTable";
import { CandidateInspectorDrawer } from "./components/CandidateInspectorDrawer";
import { DecisionSynthesisCard } from "./components/DecisionSynthesisCard";
import { IncomingScenarioHandoffBanner } from "./components/IncomingScenarioHandoffBanner";

export const ParetoView: React.FC = () => {
  const { 
    activeScenarioParetoHandoff, 
    setActiveScenarioParetoHandoff,
    setActivePage,
  } = useAppStore();
  const { data: dnaStatus } = useDNAStatus();

  // Selected Plot Axes
  const [xAxisKey, setXAxisKey] = useState<string>("conversion_rate_percent");
  const [yAxisKey, setYAxisKey] = useState<string>("net_merchant_revenue_inr");

  // Active Objectives
  const [activeObjectives, setActiveObjectives] = useState<ObjectiveType[]>([
    "MAX_NET_REVENUE",
    "MAX_CONVERSION_RATE",
    "MIN_PROCESSING_FEES",
  ]);

  // Operational Constraints
  const [minConversion, setMinConversion] = useState<number>(80.0);
  const [maxMdrFees, setMaxMdrFees] = useState<number>(15000);
  const [maxFailureRate, setMaxFailureRate] = useState<number>(18.0);
  const [enableConstraints, setEnableConstraints] = useState<boolean>(true);

  // Common Population Settings
  const [populationSize, setPopulationSize] = useState<number>(1000);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  // Candidate Selection & Inspector Drawer State
  const [selectedCandidate, setSelectedCandidate] = useState<ParetoScenarioItem | InfeasibleScenarioItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Pareto Optimization Mutation
  const {
    mutate: executeOptimization,
    isPending: isOptimizing,
    data: paretoResult,
    isError,
    error,
  } = useParetoOptimization();

  // Parameter Search Matrix: 3 x 3 x 3 = 27 candidates
  const upiGrid = [0.85, 0.90, 0.95];
  const cardMdrGrid = [1.20, 1.85, 2.50];
  const retriesGrid = [1, 2, 3];
  const candidateCount = upiGrid.length * cardMdrGrid.length * retriesGrid.length;

  const runOptimization = (
    pop = populationSize,
    seed = randomSeed,
    minConv = minConversion,
    maxFail = maxFailureRate,
    maxFees = maxMdrFees,
    withConstraints = enableConstraints
  ) => {
    const constraints: MerchantConstraint[] = [];
    if (withConstraints) {
      if (minConv > 0) {
        constraints.push({
          constraint_type: "MIN_CONVERSION_RATE",
          threshold_value: minConv,
          description: `Minimum capture conversion rate >= ${minConv}%`,
        });
      }
      if (maxFees > 0) {
        constraints.push({
          constraint_type: "MAX_PROCESSING_FEES",
          threshold_value: maxFees,
          description: `Maximum gateway MDR fees <= ₹${maxFees.toLocaleString()}`,
        });
      }
      if (maxFail > 0) {
        constraints.push({
          constraint_type: "MAX_FAILURE_RATE",
          threshold_value: maxFail,
          description: `Maximum terminal failure rate <= ${maxFail}%`,
        });
      }
    }

    const request: OptimizationRequest = {
      optimization_name: "Multi-Objective Payment Trade-off Optimization",
      objectives: activeObjectives,
      constraints,
      parameter_ranges: {
        upi_success: upiGrid,
        card_mdr: cardMdrGrid,
        max_retries: retriesGrid,
      },
      population_size: pop,
      random_seed: seed,
      max_candidates: 150,
    };

    executeOptimization(request);
  };

  // Auto-run on initial mount
  const hasAutoRun = useRef(false);
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      runOptimization(1000, 42, 80.0, 18.0, 15000, true);
    }
  }, [executeOptimization]);

  const handleReset = () => {
    setMinConversion(80.0);
    setMaxFailureRate(18.0);
    setMaxMdrFees(15000);
    setEnableConstraints(true);
    setPopulationSize(1000);
    setRandomSeed(42);
    runOptimization(1000, 42, 80.0, 18.0, 15000, true);
  };

  const handleSelectCandidate = (candidate: ParetoScenarioItem | InfeasibleScenarioItem) => {
    setSelectedCandidate(candidate);
    setIsInspectorOpen(true);
  };

  // Authoritative recommended operating point (highest net merchant revenue on frontier)
  const recommendedCandidate = useMemo(() => {
    if (!paretoResult || !paretoResult.frontier_scenarios || paretoResult.frontier_scenarios.length === 0) {
      return null;
    }
    return paretoResult.frontier_scenarios.reduce((prev, curr) => {
      const prevRev = prev.objective_values?.net_merchant_revenue_inr ?? 0;
      const currRev = curr.objective_values?.net_merchant_revenue_inr ?? 0;
      return currRev > prevRev ? curr : prev;
    });
  }, [paretoResult]);

  const handleOpenInWhatIf = (_candidate?: ParetoScenarioItem) => {
    // Navigate back to What-If Studio
    setActivePage("scenarios");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. COMPACT OPERATIONAL HEADER */}
      <ParetoHeader
        reliabilityGrade={dnaStatus?.confidence_grade}
        provenanceType={dnaStatus?.provenance_type}
        baselineSampleSize={dnaStatus?.available_sample_count ?? 650}
        isOptimizing={isOptimizing}
        onRunOptimization={() => runOptimization()}
        onReset={handleReset}
        onBackToWhatIf={() => setActivePage("scenarios")}
        candidateCount={candidateCount}
      />

      {/* 2. INCOMING WHAT-IF HANDOFF CONTEXT BANNER */}
      <IncomingScenarioHandoffBanner
        handoff={activeScenarioParetoHandoff}
        onDismiss={() => setActiveScenarioParetoHandoff(null)}
      />

      {/* 3. OPTIMIZATION OBJECTIVES STRIP */}
      <OptimizationObjectivesStrip
        activeObjectives={activeObjectives}
        onToggleObjective={(obj) => {
          setActiveObjectives((prev) =>
            prev.includes(obj)
              ? prev.length > 2
                ? prev.filter((o) => o !== obj)
                : prev
              : [...prev, obj]
          );
        }}
      />

      {/* 4. CONSTRAINTS & SEARCH SPACE CONFIGURATION */}
      <ConstraintsAndSearchSpace
        minConversion={minConversion}
        onMinConversionChange={setMinConversion}
        maxFailureRate={maxFailureRate}
        onMaxFailureRateChange={setMaxFailureRate}
        maxMdrFees={maxMdrFees}
        onMaxMdrFeesChange={setMaxMdrFees}
        enableConstraints={enableConstraints}
        onToggleConstraints={() => setEnableConstraints(!enableConstraints)}
        populationSize={populationSize}
        onPopulationSizeChange={setPopulationSize}
        randomSeed={randomSeed}
        onRandomSeedChange={setRandomSeed}
        candidateCount={candidateCount}
      />

      {/* ERROR ALERTS */}
      {isError && (
        <ErrorAlert
          title="Optimization Execution Failed"
          message={(error as Error)?.message || "Failed to execute Pareto frontier search."}
        />
      )}

      {/* 5. ANALYTICAL SUMMARY STRIP (AFTER RUN) */}
      {paretoResult && (
        <OptimizationSummaryStrip result={paretoResult} />
      )}

      {/* 6. PARETO FRONTIER SCATTER INSTRUMENT (THE CENTERPIECE) */}
      {paretoResult && (
        <ParetoFrontierChart
          frontierScenarios={paretoResult.frontier_scenarios}
          dominatedScenarios={paretoResult.dominated_scenarios}
          infeasibleScenarios={paretoResult.infeasible_scenarios}
          baselineSummary={paretoResult.baseline_summary}
          selectedCandidateId={selectedCandidate?.scenario_id}
          onSelectCandidate={handleSelectCandidate}
          xAxisKey={xAxisKey}
          onXAxisKeyChange={setXAxisKey}
          yAxisKey={yAxisKey}
          onYAxisKeyChange={setYAxisKey}
        />
      )}

      {/* 7. CANDIDATE EVALUATION TABLE */}
      {paretoResult && (
        <FrontierCandidatesTable
          frontierScenarios={paretoResult.frontier_scenarios}
          dominatedScenarios={paretoResult.dominated_scenarios}
          selectedCandidateId={selectedCandidate?.scenario_id}
          onSelectCandidate={handleSelectCandidate}
        />
      )}

      {/* 8. DECISION SYNTHESIS & RECOMMENDED OPERATING POINT */}
      {paretoResult && recommendedCandidate && (
        <DecisionSynthesisCard
          recommendedCandidate={recommendedCandidate}
          baselineSummary={paretoResult.baseline_summary}
          onOpenInWhatIf={handleOpenInWhatIf}
        />
      )}

      {/* 9. SELECTED CANDIDATE INSPECTOR DRAWER */}
      <CandidateInspectorDrawer
        candidate={selectedCandidate}
        baselineSummary={paretoResult?.baseline_summary}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onOpenInWhatIf={handleOpenInWhatIf}
      />
    </div>
  );
};
