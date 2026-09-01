import React, { useState } from "react";
import { useCompareScenarios } from "@/hooks/useScenarios";
import { useDNAStatus, useDNAProfile } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { 
  ScenarioConfig, 
  ScenarioIntervention 
} from "@/types/scenario";
import { AttributionTrail } from "@/components/domain/AttributionTrail";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { 
  FlaskConical, 
  ShieldAlert, 
  X, 
  Sliders, 
  TrendingUp, 
  DollarSign, 
  RotateCcw,
  Zap
} from "lucide-react";

export const ScenariosView: React.FC = () => {
  const { activeTwinHandoff, setActiveTwinHandoff } = useAppStore();
  const { data: dnaStatus } = useDNAStatus();
  const { data: dnaProfile } = useDNAProfile();

  // Baseline empirical defaults from DNA
  const baselineUpiRate = dnaProfile?.success_dynamics.by_method.upi?.rate ?? 0.88;
  const baselineCardRate = dnaProfile?.success_dynamics.by_method.card?.rate ?? 0.85;
  const baselineCardMdr = dnaProfile?.fee_economics.mdr_by_method_percent.card ?? 1.85;

  // Controlled Intervention Levers State
  const [upiDelta, setUpiDelta] = useState<number>(0.0); // e.g. +0.05 (+5%)
  const [cardDelta, setCardDelta] = useState<number>(0.0);
  const [routingShift, setRoutingShift] = useState<number>(0.0); // % shift
  const [maxRetries, setMaxRetries] = useState<number>(1);
  const retryMultiplier = 1.0;
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

  const handleRunWhatIf = () => {
    const interventions: ScenarioIntervention[] = [];

    // 1. UPI Success Rate Intervention
    if (upiDelta !== 0.0) {
      interventions.push({
        intervention_type: "METHOD_SUCCESS_RATE",
        target: "upi",
        mode: "DELTA",
        value: upiDelta,
        description: `Shift UPI success rate by ${(upiDelta * 100).toFixed(1)}%`,
      });
    }

    // 2. Card Success Rate Intervention
    if (cardDelta !== 0.0) {
      interventions.push({
        intervention_type: "METHOD_SUCCESS_RATE",
        target: "card",
        mode: "DELTA",
        value: cardDelta,
        description: `Shift Card success rate by ${(cardDelta * 100).toFixed(1)}%`,
      });
    }

    // 3. Routing Preference Shift
    if (routingShift !== 0.0) {
      interventions.push({
        intervention_type: "METHOD_ROUTING_PREFERENCE",
        target: routingShift > 0 ? "upi" : "card",
        shift_percentage: Math.abs(routingShift),
        description: `Shift ${Math.abs(routingShift)}% traffic toward ${routingShift > 0 ? "UPI" : "Cards"}`,
      });
    }

    // 4. Retry Policy
    if (maxRetries !== 1 || retryMultiplier !== 1.0) {
      interventions.push({
        intervention_type: "RETRY_POLICY",
        max_retries_override: maxRetries,
        retry_propensity_multiplier: retryMultiplier,
        description: `Retry policy: max ${maxRetries} retries with ${retryMultiplier}x propensity`,
      });
    }

    // 5. Card MDR Rate
    if (cardMdrRate !== baselineCardMdr) {
      interventions.push({
        intervention_type: "FEE_MDR_RATE",
        target: "card",
        value: cardMdrRate,
        description: `Card MDR rate adjusted to ${cardMdrRate}%`,
      });
    }

    // Fallback: If no changes adjusted, add default neutral intervention
    if (interventions.length === 0) {
      interventions.push({
        intervention_type: "METHOD_SUCCESS_RATE",
        target: "upi",
        mode: "DELTA",
        value: 0.03,
        description: "Explore 3% boost in UPI capture rate",
      });
    }

    const scenario: ScenarioConfig = {
      scenario_id: `scen_${Date.now()}`,
      scenario_name: "Counterfactual Policy Experiment",
      description: "User-configured What-If intervention evaluated against baseline under CRN",
      interventions,
      population_size: populationSize,
      random_seed: randomSeed,
    };

    runComparison({
      scenarios: [scenario],
      population_size: populationSize,
      random_seed: randomSeed,
    });
  };

  const activeComparison = compareResult?.comparisons?.[0];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header & Meta */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-twin-cyan" />
            <h2 className="text-base font-display font-bold text-twin-white tracking-tight">
              What-If Scenario Studio
            </h2>
            <Badge variant="cyan" size="sm">CAUSAL LAB</Badge>
          </div>
          <p className="text-xs text-twin-slate">
            Change payment system levers. Simulate downstream conversion, revenue, and fee effects under Common Random Numbers (CRN).
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

      {/* Guardian Anomaly Context Banner (if navigated from Guardian) */}
      {activeTwinHandoff && (
        <div className="p-4 rounded-xl border border-twin-warning/40 bg-twin-warning/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-twin-warning flex-shrink-0" />
            <div className="space-y-0.5 text-xs font-mono">
              <span className="font-bold text-twin-white uppercase">
                GUARDIAN CONTEXT: {activeTwinHandoff.anomaly_type.replace(/_/g, " ")}
              </span>
              <p className="text-twin-slate text-[11px]">
                Detected deviation on <strong>{activeTwinHandoff.target_entity.toUpperCase()}</strong> ({(activeTwinHandoff.delta * 100).toFixed(1)}% Δ). Test a counterfactual policy change below.
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

      {/* Scenario Levers Control Panel */}
      <Card variant="primary" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-twin-border/60 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-sm">Intervention Parameter Levers</CardTitle>
            <CardDescription>
              Configure policy changes. All counterfactual simulations run with Common Random Numbers (CRN) for isolated delta attribution.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              isLoading={isComparing}
              disabled={!dnaStatus?.profiling_available}
              onClick={handleRunWhatIf}
            >
              <FlaskConical className="w-4 h-4" />
              Run What-If Simulation
            </Button>
          </div>
        </div>

        {/* 5 Laboratory Levers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Lever 1: UPI Success Rate Shift */}
          <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-twin-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-twin-cyan" />
                1. UPI Success Shift
              </span>
              <span className="font-mono text-twin-cyan">
                {upiDelta > 0 ? "+" : ""}{(upiDelta * 100).toFixed(1)}% Δ
              </span>
            </div>
            <Slider
              value={Math.round(upiDelta * 100)}
              onChange={(val) => setUpiDelta(val / 100)}
              min={-20}
              max={20}
              step={1}
              unit="%"
            />
            <div className="flex justify-between text-[10px] font-mono text-twin-slate">
              <span>Baseline: {(baselineUpiRate * 100).toFixed(1)}%</span>
              <span>Scenario: {((baselineUpiRate + upiDelta) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Lever 2: Card Success Rate Shift */}
          <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-twin-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-twin-indigo" />
                2. Card Success Shift
              </span>
              <span className="font-mono text-twin-indigo">
                {cardDelta > 0 ? "+" : ""}{(cardDelta * 100).toFixed(1)}% Δ
              </span>
            </div>
            <Slider
              value={Math.round(cardDelta * 100)}
              onChange={(val) => setCardDelta(val / 100)}
              min={-20}
              max={20}
              step={1}
              unit="%"
            />
            <div className="flex justify-between text-[10px] font-mono text-twin-slate">
              <span>Baseline: {(baselineCardRate * 100).toFixed(1)}%</span>
              <span>Scenario: {((baselineCardRate + cardDelta) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Lever 3: Routing Preference Shift */}
          <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-twin-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-twin-warning" />
                3. Routing Shift (% to UPI)
              </span>
              <span className="font-mono text-twin-warning">
                {routingShift > 0 ? "+" : ""}{routingShift}%
              </span>
            </div>
            <Slider
              value={routingShift}
              onChange={setRoutingShift}
              min={-30}
              max={30}
              step={5}
              unit="%"
            />
            <div className="flex justify-between text-[10px] font-mono text-twin-slate">
              <span>&larr; Favor Cards</span>
              <span>Favor UPI &rarr;</span>
            </div>
          </div>

          {/* Lever 4: Retry Policy */}
          <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-twin-white flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-twin-success" />
                4. Max Retries Limit
              </span>
              <span className="font-mono text-twin-success">{maxRetries} max</span>
            </div>
            <Slider
              value={maxRetries}
              onChange={setMaxRetries}
              min={0}
              max={4}
              step={1}
              unit=" retries"
            />
            <div className="flex justify-between text-[10px] font-mono text-twin-slate">
              <span>0 (No retries)</span>
              <span>4 (Aggressive)</span>
            </div>
          </div>

          {/* Lever 5: Card MDR Rate */}
          <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-twin-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-twin-cyan" />
                5. Card MDR Rate (%)
              </span>
              <span className="font-mono text-twin-cyan">{cardMdrRate.toFixed(2)}%</span>
            </div>
            <Slider
              value={Math.round(cardMdrRate * 100)}
              onChange={(val) => setCardMdrRate(val / 100)}
              min={100}
              max={350}
              step={5}
              unit="%"
            />
            <div className="flex justify-between text-[10px] font-mono text-twin-slate">
              <span>Baseline: {baselineCardMdr.toFixed(2)}%</span>
              <span>Delta: {(cardMdrRate - baselineCardMdr).toFixed(2)}%</span>
            </div>
          </div>

          {/* Simulation Population Config */}
          <div className="p-4 rounded-xl bg-twin-card/50 border border-twin-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-twin-white">Common Seed / Population</span>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
                className="w-16 px-1.5 py-0.5 rounded bg-twin-card border border-twin-border text-xs font-mono text-twin-cyan text-right focus:outline-none"
              />
            </div>
            <Slider
              value={populationSize}
              onChange={setPopulationSize}
              min={500}
              max={3000}
              step={250}
              unit=" agents"
            />
            <div className="flex justify-between text-[10px] font-mono text-twin-slate">
              <span>CRN Paired Simulation</span>
              <span>{populationSize} agents</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {isError && (
        <ErrorAlert
          title="What-If Simulation Failed"
          message={(error as Error)?.message || "Failed to execute What-If scenario."}
        />
      )}

      {/* Comparison Results & Causal Attribution */}
      {activeComparison && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-twin-border/60 pb-2">
            <h3 className="text-xs font-mono font-bold text-twin-cyan uppercase tracking-wider">
              Comparative Impact Analysis (Baseline vs Scenario under CRN)
            </h3>
            <span className="text-[10px] font-mono text-twin-slate">
              POPULATION: {populationSize} AGENTS | SEED: {randomSeed}
            </span>
          </div>

          {/* Comparative KPI Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(activeComparison.metric_comparisons).slice(0, 4).map(([mKey, comp]) => (
              <div
                key={mKey}
                className="p-5 rounded-xl glass-panel border border-twin-border space-y-2 font-mono"
              >
                <span className="text-[11px] font-semibold text-twin-slate uppercase block truncate">
                  {mKey.replace(/_/g, " ")}
                </span>
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-bold text-twin-white">
                    {mKey.includes("rate")
                      ? `${comp.scenario_value.toFixed(1)}%`
                      : mKey.includes("revenue") || mKey.includes("volume") || mKey.includes("fee")
                      ? `₹${comp.scenario_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                      : comp.scenario_value.toFixed(2)}
                  </div>
                  <Badge
                    variant={comp.absolute_delta >= 0 ? "success" : "danger"}
                    size="sm"
                  >
                    {comp.absolute_delta > 0 ? "+" : ""}
                    {mKey.includes("rate")
                      ? `${comp.absolute_delta.toFixed(1)}%`
                      : comp.percentage_delta !== null
                      ? `${(comp.percentage_delta ?? 0).toFixed(1)}%`
                      : `${comp.absolute_delta.toFixed(1)}`}
                  </Badge>
                </div>
                <div className="flex justify-between text-[10px] text-twin-slate border-t border-twin-border/40 pt-1.5">
                  <span>Baseline: {mKey.includes("rate") ? `${comp.baseline_value.toFixed(1)}%` : comp.baseline_value.toLocaleString()}</span>
                  <span>Scenario: {mKey.includes("rate") ? `${comp.scenario_value.toFixed(1)}%` : comp.scenario_value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Causal Attribution Chain */}
          {activeComparison.attribution_trail && activeComparison.attribution_trail.length > 0 && (
            <AttributionTrail steps={activeComparison.attribution_trail} />
          )}

          {/* Method-Level Deltas Table */}
          {activeComparison.method_deltas && Object.keys(activeComparison.method_deltas).length > 0 && (
            <Card variant="primary">
              <CardHeader>
                <CardTitle className="text-sm">Payment Rail Delta Breakdown</CardTitle>
                <CardDescription>Shift in transaction volumes and conversion rates per payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Volume Shift (INR)</TableHead>
                      <TableHead>Captured Delta</TableHead>
                      <TableHead className="text-right">Success Rate Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(activeComparison.method_deltas).map(([method, deltas]) => (
                      <TableRow key={method}>
                        <TableCell className="font-mono text-xs font-bold uppercase text-twin-white">
                          {method}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-twin-white">
                          {deltas.captured_volume_delta_inr !== undefined
                            ? `₹${deltas.captured_volume_delta_inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                            : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-twin-slate">
                          {deltas.captured_count_delta !== undefined
                            ? `${deltas.captured_count_delta > 0 ? "+" : ""}${deltas.captured_count_delta}`
                            : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-twin-cyan text-right">
                          {deltas.success_rate_delta_percent !== undefined
                            ? `${deltas.success_rate_delta_percent > 0 ? "+" : ""}${deltas.success_rate_delta_percent.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
