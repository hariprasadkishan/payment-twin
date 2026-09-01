import React, { useState } from "react";
import { useRunSimulation, useRunMonteCarlo } from "@/hooks/useSimulation";
import { useDNAStatus } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { AgentSimulationResult } from "@/types/simulation";
import { FunnelCanvas } from "@/components/domain/FunnelCanvas";
import { KPIMetricCard } from "@/components/domain/KPIMetricCard";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
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
  X
} from "lucide-react";

export const TwinView: React.FC = () => {
  const { 
    activeTwinHandoff, 
    setActiveTwinHandoff 
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

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header & Meta */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-twin-cyan" />
            <h2 className="text-base font-display font-bold text-twin-white tracking-tight">
              Payment Twin Funnel Simulator
            </h2>
            <Badge variant="cyan" size="sm">DISCRETE-EVENT ENGINE</Badge>
          </div>
          <p className="text-xs text-twin-slate">
            Simulates how synthetic Customer Agents calibrated to Behavioral DNA traverse the merchant payment funnel.
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

      {/* Guardian Context Handoff Banner (if arrived from Guardian) */}
      {activeTwinHandoff && (
        <div className="p-4 rounded-xl border border-twin-warning/40 bg-twin-warning/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-twin-warning flex-shrink-0" />
            <div className="space-y-0.5 text-xs font-mono">
              <span className="font-bold text-twin-white uppercase">
                GUARDIAN CONTEXT LOADED: {activeTwinHandoff.anomaly_type.replace(/_/g, " ")}
              </span>
              <p className="text-twin-slate text-[11px]">
                Target: <strong>{activeTwinHandoff.target_entity.toUpperCase()}</strong> | 
                Shift: <strong className="text-twin-danger">{(activeTwinHandoff.delta * 100).toFixed(1)}% Δ</strong> | 
                Est. Revenue at Risk: <strong className="text-twin-warning">₹{activeTwinHandoff.estimated_revenue_at_risk_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTwinHandoff(null)}
            className="text-twin-slate hover:text-twin-white"
          >
            <X className="w-4 h-4" />
            Dismiss
          </Button>
        </div>
      )}

      {/* Simulation Control Bar */}
      <Card variant="primary" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <Tabs value={simMode} onValueChange={(val) => setSimMode(val as any)}>
              <TabsList>
                <TabsTrigger value="single">Single Run</TabsTrigger>
                <TabsTrigger value="monte_carlo">Monte Carlo Sweep</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button
            variant="primary"
            size="md"
            isLoading={isSimulating}
            disabled={!dnaStatus?.profiling_available}
            onClick={handleRun}
          >
            <PlayCircle className="w-4 h-4" />
            {simMode === "single" ? "Run Simulation" : `Run Monte Carlo (${monteCarloRuns} Runs)`}
          </Button>
        </div>

        {/* Sliders and Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Slider
            label="Population Size"
            value={populationSize}
            onChange={setPopulationSize}
            min={100}
            max={5000}
            step={100}
            unit=" agents"
          />

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-twin-slate font-medium">Random Seed (Reproducibility)</span>
              <span className="font-mono text-twin-cyan">{randomSeed}</span>
            </div>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 rounded-lg bg-twin-card border border-twin-border text-xs font-mono text-twin-white focus:outline-none focus:ring-1 focus:ring-twin-cyan"
            />
          </div>

          {simMode === "monte_carlo" && (
            <Slider
              label="Monte Carlo Runs"
              value={monteCarloRuns}
              onChange={setMonteCarloRuns}
              min={5}
              max={50}
              step={5}
              unit=" sweeps"
            />
          )}
        </div>
      </Card>

      {/* Error Alert */}
      {(isSingleError || isMonteCarloError) && (
        <ErrorAlert
          title="Simulation Execution Failed"
          message={((singleError || monteCarloError) as Error)?.message || "Failed to execute simulation."}
        />
      )}

      {/* Hero Visualization: Funnel Canvas Engine */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-twin-cyan" />
            Synthetic Customer Funnel Progression
          </h3>
          <span className="text-[11px] font-mono text-twin-slate">
            {singleResult ? `PROCESSED ${singleResult.population_size} AGENTS` : "STANDBY"}
          </span>
        </div>

        <FunnelCanvas
          simulationResult={singleResult}
          isSimulating={isSimulating}
          height={380}
        />
      </div>

      {/* Single Run Executive KPI Results */}
      {singleResult && singleResult.kpis && simMode === "single" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-twin-border/60 pb-2">
            <h3 className="text-xs font-mono font-bold text-twin-cyan uppercase tracking-wider">
              Executive Simulation Projections (Synthetic Output)
            </h3>
            <span className="text-[10px] font-mono text-twin-slate">
              DURATION: {singleResult.kpis.execution_duration_ms.toFixed(1)}ms
            </span>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIMetricCard
              title="Conversion Rate"
              value={singleResult.kpis.conversion_rate_percent}
              unit="%"
              decimals={1}
              tooltipText="Projected percentage of synthetic agents successfully capturing payments."
            />
            <KPIMetricCard
              title="Captured Volume"
              value={singleResult.kpis.captured_volume_inr}
              unit="INR"
              decimals={0}
              tooltipText="Projected gross captured order volume in INR."
            />
            <KPIMetricCard
              title="Net Merchant Revenue"
              value={singleResult.kpis.net_merchant_revenue_inr}
              unit="INR"
              decimals={0}
              tooltipText="Projected net revenue after deducting MDR gateway processing fees and taxes."
            />
            <KPIMetricCard
              title="Terminal Failure Rate"
              value={singleResult.kpis.failure_rate_percent}
              unit="%"
              decimals={1}
              tooltipText="Projected terminal checkout declines."
            />
          </div>

          {/* Accessible Table: Method Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="primary">
              <CardHeader>
                <CardTitle className="text-sm">Instrument Performance Breakdown</CardTitle>
                <CardDescription>Simulated conversion rates and fees per payment rail</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Captured</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead className="text-right">MDR Fees</TableHead>
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
                <CardDescription>Stage dropouts and decline bottlenecks identified in simulation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(singleResult.funnel_dropoffs).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="p-3 rounded-lg bg-twin-card/50 border border-twin-border flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-twin-slate capitalize">{stage.replace(/_/g, " ")}:</span>
                    <span className="text-twin-danger font-bold">{count} agents</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sampled Agent Traces Preview */}
          {singleResult.preview_agent_traces && singleResult.preview_agent_traces.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
                Simulated Agent Lifecycle Traces (Click to Inspect Events)
              </h3>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Archetype</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Final Method</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Amount (INR)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                        <Button variant="ghost" size="sm">Trace Log →</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Monte Carlo Results Display */}
      {monteCarloResult && simMode === "monte_carlo" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-twin-border/60 pb-2">
            <h3 className="text-xs font-mono font-bold text-twin-cyan uppercase tracking-wider">
              Monte Carlo Uncertainty Analysis ({monteCarloResult.total_runs} Independent Sweeps)
            </h3>
            <span className="text-[10px] font-mono text-twin-slate">
              TOTAL DURATION: {monteCarloResult.execution_duration_ms.toFixed(1)}ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(monteCarloResult.summary_metrics).map(([metricKey, dist]) => (
              <Card key={metricKey} variant="primary" className="p-5 space-y-3 font-mono text-xs">
                <span className="text-[11px] font-bold text-twin-white uppercase block">
                  {metricKey.replace(/_/g, " ")}
                </span>
                
                <div className="p-3 rounded bg-twin-card/60 border border-twin-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-twin-slate">Mean:</span>
                    <span className="text-twin-cyan font-bold">
                      {metricKey.includes("rate") ? `${dist.mean.toFixed(1)}%` : `₹${dist.mean.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate">95% CI:</span>
                    <span className="text-twin-white font-semibold">
                      [{dist.ci_95[0].toFixed(1)} - {dist.ci_95[1].toFixed(1)}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate">Median (p50):</span>
                    <span className="text-twin-white">{dist.p50.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-twin-slate">Std Dev:</span>
                    <span className="text-twin-slate">{dist.std_dev.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Agent Trace Drawer */}
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
              <span className="text-twin-slate">
                Total Attempts: {selectedAgentTrace.total_attempts}
              </span>
            </div>

            {/* Event Trace Log */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                Chronological Event Log
              </span>
              <div className="space-y-2">
                {selectedAgentTrace.event_trace.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-twin-card/60 border border-twin-border space-y-1 text-[11px]"
                  >
                    <div className="flex justify-between text-twin-cyan font-bold">
                      <span>{evt.action}</span>
                      <span className="text-twin-slate">{evt.timestamp_ms}ms</span>
                    </div>
                    <div className="text-twin-slate">
                      {evt.state_from} → <strong className="text-twin-white">{evt.state_to}</strong>
                    </div>
                    {evt.method && (
                      <div className="text-[10px] text-twin-slate">
                        Method: <span className="uppercase text-twin-white">{evt.method}</span> | Amount: ₹{evt.amount_inr}
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
