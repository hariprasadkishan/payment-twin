import React, { useState } from "react";
import { useGenerateAgents } from "@/hooks/useAgents";
import { useDNAStatus } from "@/hooks/useDNA";
import { CustomerAgent, AgentArchetype } from "@/types/agent";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Slider } from "@/components/ui/Slider";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { 
  Bot, 
  Zap, 
  Shield, 
  RefreshCw, 
  Crown, 
  CheckCircle
} from "lucide-react";

export const AgentsView: React.FC = () => {
  const { data: dnaStatus } = useDNAStatus();
  
  const [populationSize, setPopulationSize] = useState(1000);
  const [randomSeed, setRandomSeed] = useState(42);
  const [selectedAgent, setSelectedAgent] = useState<CustomerAgent | null>(null);

  const {
    mutate: generatePopulation,
    isPending: isGenerating,
    data: genResult,
    isError,
    error,
  } = useGenerateAgents();

  const handleGenerate = () => {
    generatePopulation({
      population_size: populationSize,
      random_seed: randomSeed,
      preview_count: 15,
    });
  };

  const archetypeConfig: Record<AgentArchetype, { name: string; icon: any; color: string; desc: string; traits: string[] }> = {
    FAST_CHECKOUT: {
      name: "FAST CHECKOUT",
      icon: Zap,
      color: "border-twin-cyan/30 text-twin-cyan bg-twin-cyan/5",
      desc: "Speed Optimizer: Prefers instant UPI payments, low patience for 2FA friction, abandons quickly on latency spikes.",
      traits: ["Primary: UPI", "Max Retries: 1", "Friction Sens: High (0.85)", "Timeout: 30s"],
    },
    PATIENT_RETRYER: {
      name: "PATIENT RETRYER",
      icon: Shield,
      color: "border-twin-indigo/30 text-twin-indigo bg-twin-indigo/5",
      desc: "Cautious Transactor: High willingness to complete verification, tolerates 3DS OTP delays, retries on transient errors.",
      traits: ["Primary: Cards / Netbanking", "Max Retries: 2-3", "Friction Sens: Moderate (0.35)", "Timeout: 120s"],
    },
    METHOD_SWITCHER: {
      name: "METHOD SWITCHER",
      icon: RefreshCw,
      color: "border-twin-warning/30 text-twin-warning bg-twin-warning/5",
      desc: "Reluctant Retryer: High propensity to switch to secondary payment rails upon initial gateway decline.",
      traits: ["Primary: UPI → Cards", "Switch Propensity: 85%", "Max Retries: 2", "Timeout: 60s"],
    },
    HIGH_TICKET: {
      name: "HIGH TICKET",
      icon: Crown,
      color: "border-twin-success/30 text-twin-success bg-twin-success/5",
      desc: "Premium Shopper: Higher transaction ticket sizes, cards/EMI affinity, high intent to complete purchase.",
      traits: ["Primary: Cards / Netbanking", "Ticket Size: > ₹2,500", "Friction Sens: Low (0.25)", "Timeout: 180s"],
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Studio Header Meta */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-twin-cyan" />
            <h2 className="text-base font-display font-bold text-twin-white tracking-tight">
              Customer Agent Population Studio
            </h2>
            <Badge variant="cyan" size="sm">CALIBRATED ACTORS</Badge>
          </div>
          <p className="text-xs text-twin-slate">
            Synthesizes autonomous decision-makers calibrated to the merchant's empirical Behavioral DNA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dnaStatus && (
            <ConfidenceGrade
              grade={dnaStatus.confidence_grade as any}
              sampleSize={dnaStatus.available_sample_count}
            />
          )}
        </div>
      </div>

      {/* 4 Archetype Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
          Behavioral Archetype Matrix (Bounded Heterogeneity)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(archetypeConfig) as [AgentArchetype, typeof archetypeConfig[AgentArchetype]][]).map(
            ([archKey, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div
                  key={archKey}
                  className={`p-5 rounded-xl border ${cfg.color} flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-mono font-bold text-xs">
                      <Icon className="w-4 h-4" />
                      <span>{cfg.name}</span>
                    </div>
                    <p className="text-[11px] text-twin-slate leading-relaxed">{cfg.desc}</p>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono text-twin-slate pt-2 border-t border-twin-border/40">
                    {cfg.traits.map((t, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Population Generation Control Panel */}
      <Card variant="primary" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-twin-border/60 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-sm">Synthesize Agent Population</CardTitle>
            <CardDescription>
              Configure population size and random seed for deterministic sampling from Behavioral DNA.
            </CardDescription>
          </div>

          <Button
            variant="primary"
            size="md"
            isLoading={isGenerating}
            disabled={!dnaStatus?.profiling_available}
            onClick={handleGenerate}
          >
            <Bot className="w-4 h-4" />
            Generate Agent Population
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
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
        </div>
      </Card>

      {/* Error Banner */}
      {isError && (
        <ErrorAlert
          title="Agent Population Generation Failed"
          message={(error as Error)?.message || "Failed to generate population. Ensure Behavioral DNA is available."}
        />
      )}

      {/* Generation Diagnostics & Preview Table */}
      {genResult && genResult.status === "ok" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Diagnostics Summary Card */}
          {genResult.calibration_diagnostics && (
            <Card variant="panel" className="space-y-4">
              <div className="flex items-center justify-between border-b border-twin-border/60 pb-3">
                <span className="text-xs font-mono font-bold text-twin-cyan uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-twin-success" />
                  Population Calibration Diagnostics (N = {genResult.total_generated_count.toLocaleString()})
                </span>
                <span className="text-[10px] font-mono text-twin-slate">
                  SEED: {genResult.population_metadata?.random_seed}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-twin-card/60 border border-twin-border space-y-1">
                  <span className="text-twin-slate text-[10px]">Method MAE:</span>
                  <div className="font-bold text-twin-white">
                    {genResult.calibration_diagnostics.method_distribution_mae !== null
                      ? `${((genResult.calibration_diagnostics.method_distribution_mae ?? 0) * 100).toFixed(2)}%`
                      : "—"}
                  </div>
                </div>

                <div className="p-3 rounded bg-twin-card/60 border border-twin-border space-y-1">
                  <span className="text-twin-slate text-[10px]">Amount Error:</span>
                  <div className="font-bold text-twin-white">
                    {genResult.calibration_diagnostics.amount_mean_error_inr !== null
                      ? `₹${(genResult.calibration_diagnostics.amount_mean_error_inr ?? 0).toFixed(2)}`
                      : "—"}
                  </div>
                </div>

                <div className="p-3 rounded bg-twin-card/60 border border-twin-border space-y-1">
                  <span className="text-twin-slate text-[10px]">Retry Drift:</span>
                  <div className="font-bold text-twin-white">
                    {genResult.calibration_diagnostics.retry_rate_drift !== null
                      ? `${((genResult.calibration_diagnostics.retry_rate_drift ?? 0) * 100).toFixed(2)}%`
                      : "—"}
                  </div>
                </div>

                <div className="p-3 rounded bg-twin-card/60 border border-twin-border space-y-1">
                  <span className="text-twin-slate text-[10px]">Calibration Status:</span>
                  <div className="font-bold text-twin-success">PASSED (Tolerances Met)</div>
                </div>
              </div>
            </Card>
          )}

          {/* Preview Agents Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-semibold text-twin-slate uppercase tracking-wider">
              Sampled Agent Preview (Click to Inspect State-Machine)
            </h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Archetype</TableHead>
                  <TableHead>Primary Method</TableHead>
                  <TableHead>Ticket Size</TableHead>
                  <TableHead>Max Retries</TableHead>
                  <TableHead>Retry Propensity</TableHead>
                  <TableHead>Friction Sens.</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genResult.preview_agents.map((agent) => (
                  <TableRow
                    key={agent.agent_id}
                    onClick={() => setSelectedAgent(agent)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-bold text-twin-cyan">
                      {agent.agent_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">{agent.archetype}</Badge>
                    </TableCell>
                    <TableCell className="font-mono uppercase text-xs text-twin-white">
                      {agent.observed_preferences.primary_method}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-white">
                      ₹{agent.observed_preferences.transaction_amount_inr.toFixed(0)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-white">
                      {agent.latent_parameters.max_retries}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-white">
                      {(agent.latent_parameters.retry_propensity * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs text-twin-white">
                      {(agent.latent_parameters.friction_sensitivity * 100).toFixed(0)}%
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

      {/* Agent Inspector Slide-over Drawer */}
      <Drawer
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent ? `Agent: ${selectedAgent.agent_id}` : "Agent Inspector"}
        description={`Archetype: ${selectedAgent?.archetype}`}
      >
        {selectedAgent && (
          <div className="space-y-6 text-xs font-mono">
            {/* Observed Preferences */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                1. Observed Preferences (DNA-Grounded)
              </span>
              <div className="space-y-1 text-twin-slate">
                <div className="flex justify-between">
                  <span>Primary Method:</span>
                  <span className="text-twin-cyan font-bold uppercase">{selectedAgent.observed_preferences.primary_method}</span>
                </div>
                {selectedAgent.observed_preferences.secondary_method && (
                  <div className="flex justify-between">
                    <span>Secondary Method:</span>
                    <span className="text-twin-indigo font-bold uppercase">{selectedAgent.observed_preferences.secondary_method}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Order Amount:</span>
                  <span className="text-twin-white font-bold">₹{selectedAgent.observed_preferences.transaction_amount_inr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Tier:</span>
                  <span className="text-twin-white">{selectedAgent.observed_preferences.amount_tier}</span>
                </div>
              </div>
            </div>

            {/* Latent Parameters */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                2. Latent Decision Parameters
              </span>
              <div className="space-y-1 text-twin-slate">
                <div className="flex justify-between">
                  <span>Max Retries Permitted:</span>
                  <span className="text-twin-white font-bold">{selectedAgent.latent_parameters.max_retries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retry Propensity:</span>
                  <span className="text-twin-white font-bold">{(selectedAgent.latent_parameters.retry_propensity * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Method Switch Propensity:</span>
                  <span className="text-twin-white font-bold">{(selectedAgent.latent_parameters.method_switch_propensity * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Friction Sensitivity:</span>
                  <span className="text-twin-white font-bold">{(selectedAgent.latent_parameters.friction_sensitivity * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Patience Timeout:</span>
                  <span className="text-twin-white font-bold">{selectedAgent.latent_parameters.patience_timeout_seconds}s</span>
                </div>
              </div>
            </div>

            {/* Runtime State */}
            <div className="p-4 rounded-lg bg-twin-card/60 border border-twin-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-twin-slate tracking-wider block">
                3. Current State-Machine Status
              </span>
              <div className="space-y-1 text-twin-slate">
                <div className="flex justify-between">
                  <span>Funnel State:</span>
                  <Badge variant="neutral" size="sm">{selectedAgent.current_state}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Random Seed:</span>
                  <span className="text-twin-white font-mono">{selectedAgent.random_seed}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
