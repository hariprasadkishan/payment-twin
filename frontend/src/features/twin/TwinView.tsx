import React, { useState } from "react";
import { useRunSimulation, useRunMonteCarlo } from "@/hooks/useSimulation";
import { useDNAStatus } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { AgentSimulationResult } from "@/types/simulation";
import { FunnelCanvas } from "@/components/domain/FunnelCanvas";
import { KPIMetricCard } from "@/components/domain/KPIMetricCard";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { LoopAnimation } from "@/components/ui/LoopAnimation";
import { TextRoll } from "@/components/ui/TextRoll";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Slider } from "@/components/ui/Slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { 
  PlayCircle, 
  Activity, 
  ShieldAlert, 
  X,
  Sparkles,
  Sliders,
  Cpu,
  FlaskConical
} from "lucide-react";
import { TwinScenarioHandoff } from "@/types/handoff";

export const TwinView: React.FC = () => {
  const { 
    activeTwinHandoff, 
    setActiveTwinHandoff,
    setActivePage,
    setActiveTwinScenarioHandoff,
  } = useAppStore();

  const { data: dnaStatus } = useDNAStatus();

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
  const isBenchmark = dnaStatus?.provenance_type === "SYNTHETIC_BENCHMARK_DATA";
  const sampleCount = dnaStatus?.available_sample_count ?? 0;

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

  return (
    <div className="space-y-10 animate-in fade-in-50 duration-300 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. EDITORIAL HEADER & PROVENANCE                                          */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-twin-border/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-twin-cyan uppercase tracking-widest font-bold">
              <Cpu className="w-4 h-4" />
              <span>PAYMENT TWIN / SIMULATION LAB</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-extrabold text-twin-white tracking-tight">
              SIMULATE THE PAYMENT JOURNEY.
            </h1>
            <p className="text-xs md:text-sm text-twin-slate/90 max-w-2xl leading-relaxed font-light">
              Payment Twin synthesizes autonomous Customer Agents from empirical Behavioral DNA, executing stochastic checkout journeys through the 6-stage funnel to project conversion economics, retry dynamics, and terminal decline bottlenecks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dnaStatus && (
              <ConfidenceGrade
                grade={dnaStatus.confidence_grade as any}
                sampleSize={dnaStatus.available_sample_count}
              />
            )}
            {isBenchmark ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono uppercase tracking-wider border border-twin-warning/30 bg-twin-warning/10 text-twin-warning font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                SYNTHETIC BENCHMARK · {sampleCount.toLocaleString()} RECORDS
              </span>
            ) : (
              <Badge variant="cyan" size="md">
                OBSERVED RAZORPAY DATA
              </Badge>
            )}
          </div>
        </div>

        {/* Guardian Context Handoff Banner (if arrived from Guardian) */}
        {activeTwinHandoff && (
          <div className="p-4 rounded-xl border border-twin-warning/40 bg-twin-warning/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-twin-warning flex-shrink-0" />
              <div className="space-y-0.5 text-xs font-mono">
                <span className="font-bold text-twin-white uppercase tracking-wider">
                  GUARDIAN CONTEXT LOADED: {activeTwinHandoff.anomaly_type.replace(/_/g, " ")}
                </span>
                <p className="text-twin-slate text-[11px] font-light">
                  Target: <strong className="font-semibold text-twin-white">{activeTwinHandoff.target_entity.toUpperCase()}</strong> | 
                  Shift: <strong className="text-twin-danger font-semibold">{(activeTwinHandoff.delta * 100).toFixed(1)}% Δ</strong> | 
                  Est. Revenue at Risk: <strong className="text-twin-warning font-semibold">₹{activeTwinHandoff.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTwinHandoff(null)}
              className="text-twin-slate hover:text-twin-white uppercase tracking-widest text-[10px] font-bold"
            >
              <X className="w-4 h-4" />
              Dismiss
            </Button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. SPEC-CELL MICRO-GRID EXPERIMENT CONTROL DECK                           */}
      {/* ========================================================================= */}
      <section className="rounded-xl border border-twin-border bg-gradient-to-b from-[#0C1220] via-[#090D17] to-[#070A11] overflow-hidden shadow-xl">
        {/* Deck Header */}
        <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-twin-border/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-twin-cyan/10 border border-twin-cyan/20 text-twin-cyan">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-twin-white">
                <TextRoll>Experiment Control Deck</TextRoll>
              </h3>
              <p className="text-[11px] text-twin-slate/85 font-light">
                Calibrate agent population, Common Random Numbers (CRN) master seed, and execution sweep mode.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={simMode} onValueChange={(val) => setSimMode(val as any)}>
              <TabsList>
                <TabsTrigger value="single">Single Deterministic Run</TabsTrigger>
                <TabsTrigger value="monte_carlo">Monte Carlo Sweep</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Spec-Cell Micro-Grid with 1px Hairline Dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-twin-border/60 bg-[#080B12]/80">
          {/* Cell 1: Population Size */}
          <div className="sm:col-span-5 p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-twin-slate font-bold block">
              01. Population Sampling
            </span>
            <Slider
              label="Agent Population"
              value={populationSize}
              onChange={setPopulationSize}
              min={100}
              max={5000}
              step={100}
              unit=" agents"
            />
          </div>

          {/* Cell 2: CRN Master Seed */}
          <div className="sm:col-span-3 p-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-twin-slate font-bold">
                02. Master Seed (CRN)
              </span>
              <span className="font-mono text-xs text-twin-cyan font-bold">{randomSeed}</span>
            </div>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 rounded bg-twin-card border border-twin-border text-xs font-mono text-twin-white focus:outline-none focus:ring-1 focus:ring-twin-cyan"
            />
            <span className="text-[9px] font-mono text-twin-slate/75 block">
              Ensures paired common randomness across scenario runs
            </span>
          </div>

          {/* Cell 3: Sweep Sweeps / Mode Type */}
          <div className="sm:col-span-2 p-5 space-y-2 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-twin-slate font-bold block">
              03. Execution Scope
            </span>
            {simMode === "monte_carlo" ? (
              <Slider
                label="Sweeps"
                value={monteCarloRuns}
                onChange={setMonteCarloRuns}
                min={5}
                max={50}
                step={5}
                unit=" sweeps"
              />
            ) : (
              <div className="space-y-1 py-1">
                <span className="text-xs font-mono text-twin-cyan font-semibold block">
                  Deterministic Markov
                </span>
                <span className="text-[9px] font-mono text-twin-slate/75 block">
                  Single paired trajectory pass
                </span>
              </div>
            )}
          </div>

          {/* Cell 4: Primary Trigger CTA */}
          <div className="sm:col-span-2 p-5 flex items-center justify-center bg-[#0B0F1A]/60">
            <Button
              variant="primary"
              size="md"
              isLoading={isSimulating}
              disabled={!dnaStatus?.profiling_available}
              onClick={handleRun}
              className="w-full gap-2 font-display tracking-widest uppercase text-xs font-bold py-3"
            >
              <PlayCircle className="w-4 h-4" />
              {isSimulating ? (
                "RUNNING..."
              ) : simMode === "single" ? (
                "RUN SIMULATION →"
              ) : (
                `RUN SWEEP (${monteCarloRuns}) →`
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {(isSingleError || isMonteCarloError) && (
        <ErrorAlert
          title="Simulation Execution Failed"
          message={((singleError || monteCarloError) as Error)?.message || "Failed to execute simulation."}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. HERO CENTERPIECE: 2D FUNNEL SIMULATOR CANVAS                           */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-xs font-mono font-bold text-twin-slate uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-twin-cyan" />
              Synthetic Customer Funnel Progression
            </h2>
            <p className="text-[11px] text-twin-slate/85 font-light">
              Visualizes stochastic customer agent traversal from Cart to Gateway and Terminal Outcomes.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            {isSimulating && (
              <LoopAnimation status="active" label="STOCHASTIC PARTICLES ACTIVE" />
            )}
            <span className="text-twin-slate uppercase tracking-wider text-[10px]">
              {singleResult ? `PROCESSED ${singleResult.population_size.toLocaleString()} AGENTS` : "AWAITING RUN"}
            </span>
          </div>
        </div>

        <FunnelCanvas
          simulationResult={singleResult}
          isSimulating={isSimulating}
          height={420}
        />
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE SIMULATION RESULT STRIP & BEFORE/AFTER EXPERIMENTAL FEEL           */}
      {/* ========================================================================= */}
      {singleResult && singleResult.kpis && simMode === "single" && (
        <section className="space-y-8 animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-twin-border/60 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-twin-cyan uppercase tracking-widest">
                  Executive Simulation Projections (Synthetic Output)
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-twin-cyan/10 border border-twin-cyan/25 text-twin-cyan">
                  SIMULATED OUTCOME vs CALIBRATED INPUT
                </span>
              </div>
              <p className="text-[11px] text-twin-slate/85 font-light">
                Forward projections based on {singleResult.population_size.toLocaleString()} autonomous customer agents. Not live historical Razorpay metrics.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-twin-slate">
              EXECUTION DURATION: {singleResult.kpis.execution_duration_ms.toFixed(1)}ms
            </span>
          </div>

          {/* 5-Column Executive KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPIMetricCard
              title="Capture Conversion Rate"
              value={singleResult.kpis.conversion_rate_percent}
              unit="%"
              decimals={1}
              tooltipText="Captured orders as a percentage of total customer agent population."
            />
            <KPIMetricCard
              title="Captured Volume (GMV)"
              value={singleResult.kpis.captured_volume_inr}
              unit="INR"
              decimals={0}
              tooltipText="Gross merchandise value of successfully captured orders in INR."
            />
            <KPIMetricCard
              title="Net Merchant Revenue"
              value={singleResult.kpis.net_merchant_revenue_inr}
              unit="INR"
              decimals={0}
              tooltipText="Net settled revenue after deducting MDR gateway processing fees and taxes."
            />
            <KPIMetricCard
              title="Terminal Failure Rate"
              value={singleResult.kpis.failure_rate_percent}
              unit="%"
              decimals={1}
              tooltipText="Orders where payment attempts were made but terminally rejected due to gateway decline or exhausted retries."
            />
            <KPIMetricCard
              title="Avg Attempts / Success"
              value={singleResult.kpis.average_attempts_per_success}
              unit=" attempts"
              decimals={2}
              tooltipText="Average payment attempts required to achieve a successful capture."
            />
          </div>

          {/* ========================================================================= */}
          {/* 5. FUNNEL OUTCOME BREAKDOWN & RETRY ANALYSIS                               */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-xl border border-twin-border/80 bg-[#0B0F19]/90 space-y-4">
            <div className="flex items-center justify-between border-b border-twin-border/50 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-twin-white">
                Funnel Conversion Progression & Outcome Accounting
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-twin-slate">
                STRICT GMV & POPULATION CONSERVATION
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border space-y-1">
                <span className="text-twin-slate text-[10px] uppercase tracking-wider">01. Initiated Population:</span>
                <div className="text-base font-bold text-twin-white">
                  {singleResult.kpis.total_agents.toLocaleString()} <span className="text-[10px] font-normal text-twin-slate">agents</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border space-y-1">
                <span className="text-twin-slate text-[10px] uppercase tracking-wider">02. Total Payment Attempts:</span>
                <div className="text-base font-bold text-twin-cyan">
                  {singleResult.kpis.total_payment_attempts.toLocaleString()} <span className="text-[10px] font-normal text-twin-slate">attempts</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border space-y-1">
                <span className="text-twin-slate text-[10px] uppercase tracking-wider">03. Successful Captures:</span>
                <div className="text-base font-bold text-twin-success">
                  {singleResult.kpis.successful_transactions.toLocaleString()} <span className="text-[10px] font-normal text-twin-slate">orders</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-twin-card/40 border border-twin-border space-y-1">
                <span className="text-twin-slate text-[10px] uppercase tracking-wider">04. Terminal Declines / Drops:</span>
                <div className="text-base font-bold text-twin-danger">
                  {(singleResult.kpis.failed_transactions + singleResult.kpis.abandoned_transactions).toLocaleString()} <span className="text-[10px] font-normal text-twin-slate">losses</span>
                </div>
                <div className="text-[9px] font-mono text-twin-slate/80 flex justify-between pt-0.5">
                  <span>{singleResult.kpis.failed_transactions} declined ({singleResult.kpis.failure_rate_percent}%)</span>
                  <span>{singleResult.kpis.abandoned_transactions} dropped ({singleResult.kpis.abandonment_rate_percent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table: Payment Instrument Performance */}
            <Card variant="primary">
              <CardHeader>
                <CardTitle className="text-sm">Instrument Performance Breakdown</CardTitle>
                <CardDescription className="font-light">Simulated conversion rates and fees per payment rail</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase tracking-wider text-[11px]">Method</TableHead>
                      <TableHead className="uppercase tracking-wider text-[11px]">Attempts</TableHead>
                      <TableHead className="uppercase tracking-wider text-[11px]">Captured</TableHead>
                      <TableHead className="uppercase tracking-wider text-[11px]">Success Rate</TableHead>
                      <TableHead className="text-right uppercase tracking-wider text-[11px]">MDR Fees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(singleResult.method_breakdown).map(([method, kpi]) => (
                      <TableRow key={method}>
                        <TableCell className="font-mono uppercase text-xs font-bold text-twin-white">
                          {method}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-twin-slate">
                          {kpi.attempted_count}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-twin-success">
                          {kpi.captured_count}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-twin-cyan">
                          {kpi.success_rate_percent.toFixed(1)}%
                        </TableCell>
                        <TableCell className="font-mono text-xs text-twin-slate text-right">
                          ₹{kpi.processing_fees_inr.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Dropoff Breakdown */}
            <Card variant="primary">
              <CardHeader>
                <CardTitle className="text-sm">Funnel Drop-Off Attribution</CardTitle>
                <CardDescription className="font-light">Stage dropouts and decline bottlenecks identified in simulation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(singleResult.funnel_dropoffs).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="p-3 rounded-lg bg-twin-card/50 border border-twin-border flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-twin-slate capitalize font-light">{stage.replace(/_/g, " ")}:</span>
                    <span className="text-twin-danger font-bold">{count} agents</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Contextual Workflow Bridge: Twin -> What-If Studio */}
          {(() => {
            const dropoffs = singleResult.funnel_dropoffs || {};
            const dropoffEntries = Object.entries(dropoffs).sort((a, b) => b[1] - a[1]);
            const [topKey, topCount] = dropoffEntries[0] || ["TERMINAL_DECLINES", singleResult.kpis.failed_transactions];
            const totalPop = singleResult.kpis.total_agents || singleResult.population_size || 1000;
            const topPercent = ((topCount / totalPop) * 100).toFixed(1);
            const formattedBottleneck = topKey.replace(/_/g, " ");

            return (
              <div className="p-4 rounded-xl border border-twin-cyan/30 bg-gradient-to-r from-twin-cyan/10 via-[#0B0F19] to-twin-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-twin-cyan/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-twin-cyan" />
                    <span className="text-xs font-mono font-bold text-twin-white uppercase tracking-widest">
                      Simulate Bottleneck Mitigation in What-If Studio
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-cyan/15 border border-twin-cyan/30 text-twin-cyan font-semibold uppercase tracking-wider">
                      CAUSAL LAB
                    </span>
                  </div>
                  <p className="text-[11px] text-twin-slate/90 font-light max-w-2xl">
                    Simulation identified <strong className="text-twin-white font-semibold">{formattedBottleneck}</strong> ({topCount} agents / {topPercent}%) as the primary conversion drag. Test counterfactual routing shifts, retry overrides, or success boost interventions against this baseline under Common Random Numbers (CRN).
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleHandoffToWhatIf}
                  className="gap-2 font-display uppercase tracking-widest text-xs font-bold whitespace-nowrap self-start sm:self-center"
                >
                  SIMULATE BOTTLENECK MITIGATION →
                </Button>
              </div>
            );
          })()}

          {/* Sampled Agent Traces Preview */}
          {singleResult.preview_agent_traces && singleResult.preview_agent_traces.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-widest">
                  Simulated Agent Lifecycle Traces (Click to Inspect Events)
                </h3>
                <span className="text-[11px] font-mono uppercase tracking-wider text-twin-slate">
                  {singleResult.preview_agent_traces.length} SAMPLE AGENTS RETURNED
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="uppercase tracking-wider text-[11px]">Agent ID</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px]">Archetype</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px]">Outcome</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px]">Final Method</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px]">Attempts</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px]">Amount (INR)</TableHead>
                    <TableHead className="text-right uppercase tracking-wider text-[11px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {singleResult.preview_agent_traces.map((trace) => (
                    <TableRow
                      key={trace.agent_id}
                      onClick={() => setSelectedAgentTrace(trace)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono text-xs font-bold text-twin-cyan">
                        {trace.agent_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" size="sm">{trace.archetype}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={trace.is_successful ? "success" : "danger"} size="sm">
                          {trace.is_successful ? "CAPTURED" : trace.final_state}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs uppercase text-twin-white">
                        {trace.final_method}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-twin-slate">
                        {trace.total_attempts}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-twin-white">
                        ₹{trace.amount_inr.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="uppercase tracking-wider text-[10px]">
                          Trace Log →
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. MONTE CARLO UNCERTAINTY SWEEP RESULTS                                  */}
      {/* ========================================================================= */}
      {monteCarloResult && simMode === "monte_carlo" && (
        <section className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-twin-border/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-mono font-bold text-twin-cyan uppercase tracking-widest">
                Monte Carlo Uncertainty Analysis ({monteCarloResult.total_runs} Independent Sweeps)
              </h3>
              <p className="text-[11px] text-twin-slate/85 font-light">
                Aggregates {monteCarloResult.total_runs} stochastic simulation runs to estimate outcome confidence intervals and standard errors.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-twin-slate">
              TOTAL DURATION: {monteCarloResult.execution_duration_ms.toFixed(1)}ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(monteCarloResult.summary_metrics).map(([metricKey, dist]) => (
              <Card key={metricKey} variant="primary" className="p-5 space-y-3 font-mono text-xs">
                <span className="text-[11px] font-bold text-twin-white uppercase tracking-wider block">
                  {metricKey.replace(/_/g, " ")}
                </span>
                
                <div className="p-3 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-twin-slate font-light">Mean:</span>
                    <span className="text-twin-cyan font-bold">
                      {metricKey.includes("rate") ? `${dist.mean.toFixed(1)}%` : `₹${dist.mean.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate font-light">95% Confidence Interval:</span>
                    <span className="text-twin-white font-semibold">
                      [{dist.ci_95[0].toFixed(1)} – {dist.ci_95[1].toFixed(1)}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate font-light">Median (p50):</span>
                    <span className="text-twin-white">{dist.p50.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate font-light">5th / 95th Percentile:</span>
                    <span className="text-twin-slate">[{dist.p5.toFixed(1)}, {dist.p95.toFixed(1)}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate font-light">Standard Deviation:</span>
                    <span className="text-twin-slate">{dist.std_dev.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. AGENT TELEMETRY INSPECTOR DRAWER                                       */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={!!selectedAgentTrace}
        onClose={() => setSelectedAgentTrace(null)}
        title={selectedAgentTrace ? `Agent Trace: ${selectedAgentTrace.agent_id}` : "Agent Trace"}
        description={`Archetype: ${selectedAgentTrace?.archetype}`}
      >
        {selectedAgentTrace && (
          <div className="space-y-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Badge variant={selectedAgentTrace.is_successful ? "success" : "danger"} size="md">
                {selectedAgentTrace.is_successful ? "PAYMENT CAPTURED" : selectedAgentTrace.terminal_reason || "DECLINED"}
              </Badge>
              <span className="text-twin-slate font-light">
                Total Attempts: <strong className="font-semibold text-twin-white">{selectedAgentTrace.total_attempts}</strong>
              </span>
            </div>

            {/* Event Trace Log */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-widest block">
                Chronological Event Log
              </span>
              <div className="space-y-2">
                {selectedAgentTrace.event_trace.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-twin-card/60 border border-twin-border space-y-1 text-[11px]"
                  >
                    <div className="flex justify-between text-twin-cyan font-bold">
                      <span className="uppercase tracking-wider">{evt.action}</span>
                      <span className="text-twin-slate font-normal">{evt.timestamp_ms}ms</span>
                    </div>
                    <div className="text-twin-slate font-light">
                      {evt.state_from} → <strong className="text-twin-white font-semibold">{evt.state_to}</strong>
                    </div>
                    {evt.method && (
                      <div className="text-[10px] text-twin-slate font-light">
                        Method: <span className="uppercase text-twin-white font-semibold">{evt.method}</span> | Amount: ₹{evt.amount_inr}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
