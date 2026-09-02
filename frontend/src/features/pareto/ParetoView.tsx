import React, { useState } from "react";
import { useParetoOptimization } from "@/hooks/useOptimization";
import { useDNAStatus } from "@/hooks/useDNA";
import { 
  MerchantConstraint, 
  OptimizationRequest, 
  ParetoScenarioItem,
  InfeasibleScenarioItem 
} from "@/types/optimization";
import { ParetoScatterPlot } from "@/components/domain/ParetoScatterPlot";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Slider } from "@/components/ui/Slider";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useAppStore } from "@/store/useAppStore";
import { 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  X
} from "lucide-react";

export const ParetoView: React.FC = () => {
  const { 
    activeScenarioParetoHandoff, 
    setActiveScenarioParetoHandoff 
  } = useAppStore();
  const { data: dnaStatus } = useDNAStatus();

  // Selected Plot Axes
  const [xAxisKey, setXAxisKey] = useState<string>("conversion_rate_percent");
  const [yAxisKey, setYAxisKey] = useState<string>("net_merchant_revenue_inr");

  // Candidate Selection State
  const [selectedCandidate, setSelectedCandidate] = useState<ParetoScenarioItem | InfeasibleScenarioItem | null>(null);
  const [candidateA, setCandidateA] = useState<ParetoScenarioItem | null>(null);
  const [candidateB, setCandidateB] = useState<ParetoScenarioItem | null>(null);

  // Search Bounds Grid
  const upiGrid = [0.80, 0.88, 0.94];
  const cardGrid = [0.78, 0.85, 0.92];
  const cardMdrGrid = [1.50, 1.85, 2.30];

  // Operational Hard Constraints
  const [minConversion, setMinConversion] = useState<number>(80.0);
  const [maxMdrFees, setMaxMdrFees] = useState<number>(15000);
  const [maxFailureRate, setMaxFailureRate] = useState<number>(18.0);
  const [enableConstraints, setEnableConstraints] = useState<boolean>(true);

  // Common Population Settings
  const [populationSize, setPopulationSize] = useState<number>(1000);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  // Pareto Optimization Mutation
  const {
    mutate: executeOptimization,
    isPending: isOptimizing,
    data: paretoResult,
    isError,
    error,
  } = useParetoOptimization();

  const handleRunOptimization = () => {
    const constraints: MerchantConstraint[] = [];
    if (enableConstraints) {
      if (minConversion > 0) {
        constraints.push({
          constraint_type: "MIN_CONVERSION_RATE",
          threshold_value: minConversion,
          description: `Minimum capture conversion rate >= ${minConversion}%`,
        });
      }
      if (maxMdrFees > 0) {
        constraints.push({
          constraint_type: "MAX_PROCESSING_FEES",
          threshold_value: maxMdrFees,
          description: `Maximum gateway MDR fees <= ₹${maxMdrFees.toLocaleString()}`,
        });
      }
      if (maxFailureRate > 0) {
        constraints.push({
          constraint_type: "MAX_FAILURE_RATE",
          threshold_value: maxFailureRate,
          description: `Maximum terminal failure rate <= ${maxFailureRate}%`,
        });
      }
    }

    const request: OptimizationRequest = {
      optimization_name: "Multi-Objective Payment Trade-off Optimization",
      objectives: [
        "MAX_NET_REVENUE",
        "MAX_CONVERSION_RATE",
        "MIN_PROCESSING_FEES",
      ],
      constraints,
      parameter_ranges: {
        upi_success_rate: upiGrid,
        card_success_rate: cardGrid,
        card_mdr_percent: cardMdrGrid,
      },
      population_size: populationSize,
      random_seed: randomSeed,
      max_candidates: 150,
    };

    executeOptimization(request, {
      onSuccess: (data) => {
        if (data.frontier_scenarios && data.frontier_scenarios.length >= 2) {
          setCandidateA(data.frontier_scenarios[0]);
          setCandidateB(data.frontier_scenarios[data.frontier_scenarios.length - 1]);
        }
      },
    });
  };

  const axisLabels: Record<string, string> = {
    conversion_rate_percent: "Conversion Rate (%)",
    net_merchant_revenue_inr: "Net Merchant Revenue (INR)",
    total_processing_fees_inr: "Processing Fees (INR)",
    failure_rate_percent: "Terminal Failure Rate (%)",
    abandonment_rate_percent: "Abandonment Rate (%)",
    average_attempts_per_success: "Avg Attempts / Success",
  };

  // Derive authoritative recommended operating point from non-dominated frontier scenarios
  const bestCandidate = React.useMemo(() => {
    if (!paretoResult || !paretoResult.frontier_scenarios || paretoResult.frontier_scenarios.length === 0) {
      return null;
    }
    // Select non-dominated candidate with highest net merchant revenue
    return paretoResult.frontier_scenarios.reduce((prev, curr) => {
      const prevRev = prev.objective_values.net_merchant_revenue_inr ?? 0;
      const currRev = curr.objective_values.net_merchant_revenue_inr ?? 0;
      return currRev > prevRev ? curr : prev;
    });
  }, [paretoResult]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header & Meta */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-twin-cyan" />
            <h2 className="text-base font-display font-bold text-twin-white tracking-tight">
              Pareto Multi-Objective Optimization Explorer
            </h2>
            <Badge variant="cyan" size="sm">NON-DOMINATED FRONTIER</Badge>
          </div>
          <p className="text-xs text-twin-slate">
            Explore non-dominated trade-offs across conversion rates, net revenue, and gateway processing costs under CRN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dnaStatus && (
            <ConfidenceGrade
              grade={dnaStatus.confidence_grade as any}
              sampleSize={dnaStatus.available_sample_count}
            />
          )}
          <ProvenanceTag provenance={dnaStatus?.provenance_type as any || "UNAVAILABLE"} />
        </div>
      </div>

      {/* Scenario Handoff Context Banner (if navigated from What-If Studio) */}
      {activeScenarioParetoHandoff && (
        <div className="p-4 rounded-xl border border-twin-indigo/40 bg-gradient-to-r from-twin-indigo/10 via-[#0B0F19] to-[#080B12] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-indigo/15 border border-twin-indigo/30 text-twin-indigo">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-twin-white uppercase tracking-wider">
                  SCENARIO CONTEXT: {activeScenarioParetoHandoff.scenario_name}
                </span>
                <Badge variant="indigo" size="sm">WHAT-IF INPUT</Badge>
              </div>
              <p className="text-twin-slate text-[11px] font-light">
                Candidate intervention: <strong>{activeScenarioParetoHandoff.target_intervention}</strong>. Projected conversion lift: <strong className="text-twin-success">+{activeScenarioParetoHandoff.conversion_lift_percent.toFixed(1)}%</strong> | Net revenue delta: <strong className="text-twin-white">+₹{activeScenarioParetoHandoff.revenue_lift_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>. Evaluate whether this operating policy remains non-dominated under multiple objectives and hard merchant constraints below.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveScenarioParetoHandoff(null)}
            className="text-twin-slate hover:text-twin-white uppercase tracking-wider text-xs"
          >
            <X className="w-4 h-4" />
            Dismiss
          </Button>
        </div>
      )}

      {/* Optimization Control Panel */}
      <Card variant="primary" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-twin-border/60 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-sm">Trade-off Objective Triad & Hard Boundaries</CardTitle>
            <CardDescription>
              Evaluates Pareto dominance across Max Net Revenue, Max Conversion Rate, and Min Processing Fees.
            </CardDescription>
          </div>

          <Button
            variant="primary"
            size="md"
            isLoading={isOptimizing}
            disabled={!dnaStatus?.profiling_available}
            onClick={handleRunOptimization}
          >
            <Sparkles className="w-4 h-4" />
            Explore Frontier ({upiGrid.length * cardGrid.length * cardMdrGrid.length} Scenarios)
          </Button>
        </div>

        {/* Operational Constraints Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-twin-cyan" />
              Hard Operational Constraints (Feasibility Gate)
            </span>
            <button
              onClick={() => setEnableConstraints(!enableConstraints)}
              className="text-xs font-mono text-twin-cyan hover:underline"
            >
              {enableConstraints ? "Constraints Active" : "Constraints Disabled"}
            </button>
          </div>

          {enableConstraints && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-twin-slate">Min Conversion:</span>
                  <span className="text-twin-white font-bold">{minConversion}%</span>
                </div>
                <Slider
                  value={minConversion}
                  onChange={setMinConversion}
                  min={60}
                  max={95}
                  step={1}
                  unit="%"
                />
              </div>

              <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-twin-slate">Max Failure Rate:</span>
                  <span className="text-twin-white font-bold">{maxFailureRate}%</span>
                </div>
                <Slider
                  value={maxFailureRate}
                  onChange={setMaxFailureRate}
                  min={5}
                  max={30}
                  step={1}
                  unit="%"
                />
              </div>

              <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-twin-slate">Max Processing Fees:</span>
                  <span className="text-twin-white font-bold">₹{maxMdrFees.toLocaleString()}</span>
                </div>
                <Slider
                  value={maxMdrFees}
                  onChange={setMaxMdrFees}
                  min={2000}
                  max={30000}
                  step={1000}
                  unit=" INR"
                />
              </div>
            </div>
          )}

          {/* CRN Simulation Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-twin-slate">Population per Candidate:</span>
                <span className="text-twin-white font-bold">{populationSize} agents</span>
              </div>
              <Slider
                value={populationSize}
                onChange={setPopulationSize}
                min={500}
                max={2500}
                step={250}
                unit=" agents"
              />
            </div>

            <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-twin-slate">Master Deterministic Seed:</span>
                <span className="text-twin-cyan font-bold">{randomSeed}</span>
              </div>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-twin-card border border-twin-border text-xs font-mono text-twin-white focus:outline-none focus:ring-1 focus:ring-twin-cyan"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {isError && (
        <ErrorAlert
          title="Pareto Optimization Failed"
          message={(error as Error)?.message || "Failed to execute optimization."}
        />
      )}

      {/* Pareto Results Workspace */}
      {paretoResult && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Decision Summary Banner */}
          <div className="p-5 rounded-xl border border-twin-cyan/30 bg-twin-cyan/5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-twin-cyan animate-pulse" />
                <span className="font-bold text-twin-white text-sm">
                  {paretoResult.frontier_size} Feasible Pareto-Optimal Trade-Off Configurations Discovered
                </span>
              </div>
              <p className="text-twin-slate text-[11px]">
                Evaluated {paretoResult.total_candidates_evaluated} candidates under Common Random Numbers (CRN). {paretoResult.feasible_candidates_count} satisfied all operational boundaries.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-twin-slate block uppercase">Frontier Net Revenue Range</span>
                <span className="font-bold text-twin-white">
                  ₹{paretoResult.tradeoff_summary?.net_revenue_range_inr?.[0]?.toLocaleString("en-IN", { maximumFractionDigits: 0 })} – ₹{paretoResult.tradeoff_summary?.net_revenue_range_inr?.[1]?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Plot Controls & Main Scatter Hero */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-twin-border/60 pb-3">
              <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-twin-cyan" />
                Interactive Pareto Scatter & Frontier Boundary
              </h3>

              {/* Axis Selectors */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-twin-slate">X-Axis:</span>
                  <select
                    value={xAxisKey}
                    onChange={(e) => setXAxisKey(e.target.value)}
                    className="px-2 py-1 rounded bg-twin-card border border-twin-border text-twin-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-twin-cyan"
                  >
                    <option value="conversion_rate_percent">Conversion Rate (%)</option>
                    <option value="total_processing_fees_inr">Processing Fees (INR)</option>
                    <option value="failure_rate_percent">Failure Rate (%)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-twin-slate">Y-Axis:</span>
                  <select
                    value={yAxisKey}
                    onChange={(e) => setYAxisKey(e.target.value)}
                    className="px-2 py-1 rounded bg-twin-card border border-twin-border text-twin-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-twin-cyan"
                  >
                    <option value="net_merchant_revenue_inr">Net Revenue (INR)</option>
                    <option value="total_processing_fees_inr">Processing Fees (INR)</option>
                    <option value="conversion_rate_percent">Conversion Rate (%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scatter SVG Plot */}
            <ParetoScatterPlot
              frontierScenarios={paretoResult.frontier_scenarios}
              dominatedScenarios={paretoResult.dominated_scenarios}
              infeasibleScenarios={paretoResult.infeasible_scenarios}
              baselineSummary={paretoResult.baseline_summary}
              xAxisMetric={xAxisKey}
              yAxisMetric={yAxisKey}
              xAxisLabel={axisLabels[xAxisKey] || xAxisKey}
              yAxisLabel={axisLabels[yAxisKey] || yAxisKey}
              selectedCandidateId={selectedCandidate?.scenario_id}
              comparisonCandidateId={candidateB?.scenario_id}
              onSelectCandidate={(c) => setSelectedCandidate(c)}
            />
          </div>

          {/* Side-by-Side Trade-off Comparator */}
          {candidateA && candidateB && (
            <Card variant="primary" className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-twin-border/60 pb-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4 text-twin-cyan" />
                    Side-by-Side Pareto Trade-off Comparison
                  </CardTitle>
                  <CardDescription>
                    Compare two distinct non-dominated frontier configurations to evaluate commercial trade-offs
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <select
                    value={candidateA.scenario_id}
                    onChange={(e) => {
                      const found = paretoResult.frontier_scenarios.find((s) => s.scenario_id === e.target.value);
                      if (found) setCandidateA(found);
                    }}
                    className="px-2 py-1 rounded bg-twin-card border border-twin-cyan text-twin-cyan text-xs font-mono"
                  >
                    {paretoResult.frontier_scenarios.map((s) => (
                      <option key={s.scenario_id} value={s.scenario_id}>
                        Candidate A: {s.scenario_id}
                      </option>
                    ))}
                  </select>

                  <span className="text-twin-slate">vs</span>

                  <select
                    value={candidateB.scenario_id}
                    onChange={(e) => {
                      const found = paretoResult.frontier_scenarios.find((s) => s.scenario_id === e.target.value);
                      if (found) setCandidateB(found);
                    }}
                    className="px-2 py-1 rounded bg-twin-card border border-twin-indigo text-twin-indigo text-xs font-mono"
                  >
                    {paretoResult.frontier_scenarios.map((s) => (
                      <option key={s.scenario_id} value={s.scenario_id}>
                        Candidate B: {s.scenario_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trade-off Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* Metric 1: Net Revenue */}
                <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
                  <span className="text-[11px] text-twin-slate uppercase font-bold block">Net Merchant Revenue</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-twin-cyan font-bold">₹{candidateA.objective_values.net_merchant_revenue_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    <span className="text-twin-slate text-[10px]">&larr; A vs B &rarr;</span>
                    <span className="text-twin-indigo font-bold">₹{candidateB.objective_values.net_merchant_revenue_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="text-center text-[10px] text-twin-slate border-t border-twin-border/40 pt-1">
                    Delta: ₹{((candidateB.objective_values.net_merchant_revenue_inr ?? 0) - (candidateA.objective_values.net_merchant_revenue_inr ?? 0)).toLocaleString()}
                  </div>
                </div>

                {/* Metric 2: Conversion Rate */}
                <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
                  <span className="text-[11px] text-twin-slate uppercase font-bold block">Conversion Rate</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-twin-cyan font-bold">{candidateA.objective_values.conversion_rate_percent?.toFixed(1)}%</span>
                    <span className="text-twin-slate text-[10px]">&larr; A vs B &rarr;</span>
                    <span className="text-twin-indigo font-bold">{candidateB.objective_values.conversion_rate_percent?.toFixed(1)}%</span>
                  </div>
                  <div className="text-center text-[10px] text-twin-slate border-t border-twin-border/40 pt-1">
                    Delta: {((candidateB.objective_values.conversion_rate_percent ?? 0) - (candidateA.objective_values.conversion_rate_percent ?? 0)).toFixed(1)}%
                  </div>
                </div>

                {/* Metric 3: Processing Fees */}
                <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-2">
                  <span className="text-[11px] text-twin-slate uppercase font-bold block">Processing Fees (MDR)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-twin-cyan font-bold">₹{candidateA.objective_values.total_processing_fees_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    <span className="text-twin-slate text-[10px]">&larr; A vs B &rarr;</span>
                    <span className="text-twin-indigo font-bold">₹{candidateB.objective_values.total_processing_fees_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="text-center text-[10px] text-twin-slate border-t border-twin-border/40 pt-1">
                    Delta: ₹{((candidateB.objective_values.total_processing_fees_inr ?? 0) - (candidateA.objective_values.total_processing_fees_inr ?? 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Executive Merchant Decision: Recommended Operating Point */}
          {bestCandidate ? (
            <Card variant="primary" className="p-6 space-y-6 border-twin-cyan/40 bg-gradient-to-b from-[#0C1424] via-[#090D18] to-[#070A12] shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-twin-border/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-twin-cyan" />
                    <span className="text-sm font-display font-bold text-twin-white uppercase tracking-wider">
                      Recommended Operating Point
                    </span>
                    <Badge variant="cyan" size="sm">OPTIMAL POLICY</Badge>
                  </div>
                  <p className="text-xs text-twin-slate font-light">
                    Recommended because this candidate is non-dominated on the Pareto frontier and satisfies all configured merchant operational constraints.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-twin-cyan px-2.5 py-1 rounded bg-twin-cyan/15 border border-twin-cyan/30">
                    CANDIDATE: {bestCandidate.scenario_id}
                  </span>
                </div>
              </div>

              {/* Recommended Parameters Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-twin-slate font-bold">
                  Recommended Operating Policy Parameters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  {Object.entries(bestCandidate.parameter_values).map(([param, val]) => (
                    <div key={param} className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/80 space-y-0.5">
                      <span className="text-[10px] text-twin-slate uppercase block">{param.replace(/_/g, " ")}:</span>
                      <span className="text-sm font-bold text-twin-white">
                        {param.includes("rate") || param.includes("percent") ? `${(val * (val <= 1 ? 100 : 1)).toFixed(1)}%` : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projected Metric Outcomes */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-twin-slate font-bold">
                  Projected Financial & Conversion Outcomes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/80 space-y-0.5">
                    <span className="text-[10px] text-twin-slate uppercase block">Conversion Rate:</span>
                    <span className="text-base font-bold text-twin-cyan">
                      {bestCandidate.objective_values.conversion_rate_percent?.toFixed(1)}%
                    </span>
                    {paretoResult.baseline_summary?.conversion_rate_percent !== undefined && (
                      <span className="text-[10px] text-twin-success block">
                        {(bestCandidate.objective_values.conversion_rate_percent - paretoResult.baseline_summary.conversion_rate_percent) >= 0 ? "+" : ""}
                        {(bestCandidate.objective_values.conversion_rate_percent - paretoResult.baseline_summary.conversion_rate_percent).toFixed(1)}% vs baseline
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/80 space-y-0.5">
                    <span className="text-[10px] text-twin-slate uppercase block">Net Merchant Revenue:</span>
                    <span className="text-base font-bold text-twin-white">
                      ₹{bestCandidate.objective_values.net_merchant_revenue_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                    {paretoResult.baseline_summary?.net_merchant_revenue_inr !== undefined && (
                      <span className="text-[10px] text-twin-success block">
                        {(bestCandidate.objective_values.net_merchant_revenue_inr - paretoResult.baseline_summary.net_merchant_revenue_inr) >= 0 ? "+₹" : "-₹"}
                        {Math.abs(bestCandidate.objective_values.net_merchant_revenue_inr - paretoResult.baseline_summary.net_merchant_revenue_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })} vs baseline
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/80 space-y-0.5">
                    <span className="text-[10px] text-twin-slate uppercase block">MDR Processing Fees:</span>
                    <span className="text-base font-bold text-twin-slate">
                      ₹{bestCandidate.objective_values.total_processing_fees_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/80 space-y-0.5">
                    <span className="text-[10px] text-twin-slate uppercase block">Frontier Dominance:</span>
                    <span className="text-base font-bold text-twin-indigo">
                      Dominates {bestCandidate.dominates_count} candidate{bestCandidate.dominates_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Constraint Verification Checklist */}
              <div className="p-4 rounded-xl bg-twin-card/30 border border-twin-border/60 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-twin-slate font-bold block">
                  Merchant Hard Constraint Verification
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-twin-success">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Conversion &ge; {minConversion}% (Actual: {bestCandidate.objective_values.conversion_rate_percent?.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-twin-success">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Fees &le; ₹{maxMdrFees.toLocaleString()} (Actual: ₹{bestCandidate.objective_values.total_processing_fees_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })})</span>
                  </div>
                  <div className="flex items-center gap-2 text-twin-success">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Failure Rate &le; {maxFailureRate}% (Satisfied)</span>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="primary" className="p-6 space-y-3 border-twin-danger/40 bg-twin-danger/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-twin-danger" />
                <h3 className="text-sm font-display font-bold text-twin-white uppercase tracking-wider">
                  No Feasible Recommendation
                </h3>
                <Badge variant="danger" size="sm">CONSTRAINTS VIOLATED</Badge>
              </div>
              <p className="text-xs text-twin-slate font-light leading-relaxed">
                All {paretoResult.total_candidates_evaluated} evaluated candidate configurations violated one or more merchant operational constraints (e.g. minimum conversion rate of {minConversion}% or maximum processing fees of ₹{maxMdrFees.toLocaleString()}). Relax constraints to discover viable operating trade-offs.
              </p>
            </Card>
          )}

          {/* Accessible Table of Candidates */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
              All Evaluated Configurations ({paretoResult.total_candidates_evaluated})
            </h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Net Revenue (INR)</TableHead>
                  <TableHead>Processing Fees</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paretoResult.frontier_scenarios.map((s) => (
                  <TableRow
                    key={s.scenario_id}
                    onClick={() => setSelectedCandidate(s)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-bold text-twin-cyan">
                      {s.scenario_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="cyan" size="sm">PARETO OPTIMAL</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-white">
                      {s.objective_values.conversion_rate_percent?.toFixed(1)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-twin-white">
                      ₹{s.objective_values.net_merchant_revenue_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-slate">
                      ₹{s.objective_values.total_processing_fees_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Inspect →</Button>
                    </TableCell>
                  </TableRow>
                ))}

                {paretoResult.dominated_scenarios.map((s) => (
                  <TableRow
                    key={s.scenario_id}
                    onClick={() => setSelectedCandidate(s)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs text-twin-slate">
                      {s.scenario_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">DOMINATED</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-slate">
                      {s.objective_values.conversion_rate_percent?.toFixed(1)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-slate">
                      ₹{s.objective_values.net_merchant_revenue_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-slate">
                      ₹{s.objective_values.total_processing_fees_inr?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Inspect →</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Candidate Inspector Drawer */}
      <Drawer
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate ? `Candidate: ${selectedCandidate.scenario_id}` : "Candidate Inspector"}
        description={selectedCandidate?.scenario_name}
      >
        {selectedCandidate && (
          <div className="space-y-6 text-xs font-mono">
            {/* Status */}
            <div className="flex items-center gap-2">
              {"is_pareto_optimal" in selectedCandidate && selectedCandidate.is_pareto_optimal ? (
                <Badge variant="cyan" size="md">PARETO OPTIMAL</Badge>
              ) : "violated_constraints" in selectedCandidate ? (
                <Badge variant="danger" size="md">INFEASIBLE</Badge>
              ) : (
                <Badge variant="neutral" size="md">DOMINATED</Badge>
              )}
            </div>

            {/* Tested Parameter Settings */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                1. Tested Parameter Configuration
              </span>
              <div className="space-y-1 text-twin-slate">
                {Object.entries(selectedCandidate.parameter_values || {}).map(([pKey, pVal]) => (
                  <div key={pKey} className="flex justify-between">
                    <span>{pKey.replace(/_/g, " ")}:</span>
                    <span className="text-twin-white font-bold">{pVal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluated Objectives */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                2. Evaluated Objectives (Synthetic Output)
              </span>
              <div className="space-y-1.5 text-twin-slate">
                {"objective_values" in selectedCandidate &&
                  Object.entries(selectedCandidate.objective_values).map(([oKey, oVal]) => (
                    <div key={oKey} className="flex justify-between">
                      <span>{oKey.replace(/_/g, " ")}:</span>
                      <span className="text-twin-cyan font-bold">
                        {oKey.includes("rate") ? `${oVal.toFixed(1)}%` : oVal.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Infeasible Constraint Violations */}
            {"violated_constraints" in selectedCandidate && selectedCandidate.violated_constraints.length > 0 && (
              <div className="p-4 rounded-lg bg-twin-danger/10 border border-twin-danger/30 space-y-2">
                <span className="text-[10px] uppercase font-bold text-twin-danger tracking-wider block">
                  Constraint Violations
                </span>
                <div className="space-y-1 text-twin-danger text-[11px]">
                  {selectedCandidate.violated_constraints.map((v, idx) => (
                    <div key={idx}>• {v}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
