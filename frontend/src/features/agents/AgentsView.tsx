import React, { useState, useEffect, useRef } from "react";
import { useGenerateAgents } from "@/hooks/useAgents";
import { useDNAStatus } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { CustomerAgent, AgentArchetype } from "@/types/agent";
import { ProvenanceTag } from "@/components/domain/ProvenanceTag";
import { ConfidenceGrade } from "@/components/domain/ConfidenceGrade";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { AgentPopulationCanvas } from "./components/AgentPopulationCanvas";
import { ArchetypeLegend } from "./components/ArchetypeLegend";
import { PopulationSynthesisDeck } from "./components/PopulationSynthesisDeck";
import { CalibrationTelemetry } from "./components/CalibrationTelemetry";
import { AgentForensics } from "./components/AgentForensics";
import { AgentInspector } from "./components/AgentInspector";
import { 
  ArrowRight, 
  Database, 
  Dna, 
  PlayCircle 
} from "lucide-react";

export const AgentsView: React.FC = () => {
  const { data: dnaStatus } = useDNAStatus();
  const { setActivePage } = useAppStore();

  const [populationSize, setPopulationSize] = useState(1000);
  const [randomSeed, setRandomSeed] = useState(42);
  const [selectedArchetype, setSelectedArchetype] = useState<AgentArchetype | "ALL" | null>("ALL");
  const [selectedAgent, setSelectedAgent] = useState<CustomerAgent | null>(null);

  const {
    mutate: generatePopulation,
    isPending: isGenerating,
    data: genResult,
    isError,
    error,
  } = useGenerateAgents();

  // Autoload initial sample population on mount if not yet generated
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      generatePopulation({
        population_size: 1000,
        random_seed: 42,
        preview_count: 25,
      });
    }
  }, [generatePopulation]);

  const handleGenerate = () => {
    generatePopulation({
      population_size: populationSize,
      random_seed: randomSeed,
      preview_count: 25,
    });
  };

  const hasPopulation = !!genResult && genResult.status === "ok";
  const totalCount = genResult?.total_generated_count ?? populationSize;
  const archetypeDistribution = genResult?.calibration_diagnostics?.archetype_distribution;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. OPERATIONAL HEADER (COMPACT & CLEAN)                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-hairline pb-3">
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-textPrimary tracking-tight">
              Customer Agents
            </h1>
            <span className="text-textTertiary text-xs">•</span>
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
              Synthetic Population Intelligence
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-normal">
            Autonomous customer actors sampled from Behavioral DNA distributions to model discrete checkout decisions, friction drop-offs, and retry persistence in Payment Twin simulation.
          </p>
        </div>

        {/* Provenance and Calibration Status Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          {dnaStatus && (
            <ConfidenceGrade
              grade={dnaStatus.confidence_grade as any}
              sampleSize={dnaStatus.available_sample_count}
            />
          )}
          <ProvenanceTag provenance={(dnaStatus?.provenance_type as any) || "SYNTHETIC_BENCHMARK_DATA"} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. POPULATION SAMPLER CONTROLS                                            */}
      {/* ========================================================================= */}
      <PopulationSynthesisDeck
        populationSize={populationSize}
        onPopulationSizeChange={setPopulationSize}
        randomSeed={randomSeed}
        onRandomSeedChange={setRandomSeed}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        profilingAvailable={dnaStatus?.profiling_available ?? true}
      />

      {/* Error Banner if generation fails */}
      {isError && (
        <ErrorAlert
          title="Agent Population Generation Failed"
          message={(error as Error)?.message || "Failed to generate population. Ensure Behavioral DNA is available."}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. BEHAVIORAL DISTRIBUTION MATRIX & ARCHETYPE EXPLORATION                 */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <AgentPopulationCanvas
          populationSize={totalCount}
          randomSeed={genResult?.population_metadata?.random_seed ?? randomSeed}
          archetypeDistribution={archetypeDistribution}
          selectedArchetype={selectedArchetype}
          onSelectArchetype={setSelectedArchetype}
          previewAgents={genResult?.preview_agents}
          onSelectAgent={setSelectedAgent}
          isGenerating={isGenerating}
        />

        {/* Archetype Filter Deck */}
        <ArchetypeLegend
          totalPopulation={totalCount}
          archetypeDistribution={archetypeDistribution}
          selectedArchetype={selectedArchetype}
          onSelectArchetype={setSelectedArchetype}
        />
      </section>

      {/* ========================================================================= */}
      {/* 4. CALIBRATION TELEMETRY (IF POPULATION GENERATED)                        */}
      {/* ========================================================================= */}
      {hasPopulation && genResult.calibration_diagnostics && (
        <CalibrationTelemetry
          diagnostics={genResult.calibration_diagnostics}
          metadata={genResult.population_metadata}
          totalGenerated={genResult.total_generated_count}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. FORENSIC AGENT AUDIT TABLE (IF POPULATION GENERATED)                   */}
      {/* ========================================================================= */}
      {hasPopulation && genResult.preview_agents && genResult.preview_agents.length > 0 && (
        <AgentForensics
          agents={genResult.preview_agents}
          selectedArchetype={selectedArchetype}
          onSelectAgent={setSelectedAgent}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. DOWNSTREAM SIMULATION BRIDGE (CLEAN WORKSPACE ACTION)                  */}
      {/* ========================================================================= */}
      <section className="rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <PlayCircle className="size-4 text-accent shrink-0" strokeWidth={1.75} />
              <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
                Synthetic Population Ready for Simulation
              </h3>
              <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                Stage 02 Active
              </span>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              These {totalCount.toLocaleString()} calibrated agents form the autonomous customer population entering the Payment Twin engine to simulate checkout funnels, routing, and retries.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActivePage("twin")}
            className="whitespace-nowrap self-start sm:self-center shadow-sm"
          >
            <span>Launch Payment Twin</span>
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>
        </div>

        {/* 3-Stage Pipeline Progression Track */}
        <div className="pt-3 border-t border-hairline">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Stage 1: Behavioral DNA */}
            <div className="p-2.5 rounded bg-canvas/60 border border-hairline/80 flex items-center gap-2.5">
              <Database className="size-3.5 text-textTertiary shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">Stage 01</span>
                <span className="text-xs font-medium text-textPrimary truncate block">Behavioral DNA</span>
                <span className="text-[10px] text-emerald-700 font-medium block">Empirical Priors</span>
              </div>
            </div>

            {/* Stage 2: Customer Agents */}
            <div className="p-2.5 rounded bg-blue-50/60 border border-blue-200/80 flex items-center gap-2.5">
              <Dna className="size-3.5 text-accent shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-accent font-semibold block uppercase tracking-wider">Stage 02 • Active</span>
                <span className="text-xs font-bold text-accent truncate block">Customer Agents</span>
                <span className="text-[10px] text-accent/80 font-medium block tabular-nums">
                  {totalCount.toLocaleString()} Calibrated Actors
                </span>
              </div>
            </div>

            {/* Stage 3: Payment Twin */}
            <div className="p-2.5 rounded bg-canvas/60 border border-hairline/80 flex items-center gap-2.5">
              <PlayCircle className="size-3.5 text-textTertiary shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-textTertiary font-medium block uppercase tracking-wider">Stage 03</span>
                <span className="text-xs font-medium text-textPrimary truncate block">Payment Twin</span>
                <span className="text-[10px] text-textTertiary block">Discrete Simulation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. AGENT INSPECTOR DRAWER                                                 */}
      {/* ========================================================================= */}
      <AgentInspector
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};

