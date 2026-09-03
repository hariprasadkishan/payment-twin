import React, { useState, useEffect, useRef } from "react";
import { useGenerateAgents } from "@/hooks/useAgents";
import { useDNAStatus } from "@/hooks/useDNA";
import { useAppStore } from "@/store/useAppStore";
import { CustomerAgent, AgentArchetype } from "@/types/agent";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { AgentPopulationRibbon } from "./components/AgentPopulationRibbon";
import { AgentArchetypeSurface } from "./components/AgentArchetypeSurface";
import { AgentFingerprintAndDecisions } from "./components/AgentFingerprintAndDecisions";
import { AgentFunnelBridge } from "./components/AgentFunnelBridge";
import { PopulationSynthesisDeck } from "./components/PopulationSynthesisDeck";
import { AgentForensics } from "./components/AgentForensics";
import { AgentInspector } from "./components/AgentInspector";
import { 
  ArrowRight, 
  Cpu, 
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export const AgentsView: React.FC = () => {
  const { data: dnaStatus } = useDNAStatus();
  const { setActivePage } = useAppStore();

  const [populationSize, setPopulationSize] = useState(1000);
  const [randomSeed, setRandomSeed] = useState(42);
  const [selectedArchetype, setSelectedArchetype] = useState<AgentArchetype>("FAST_CHECKOUT");
  const [selectedAgent, setSelectedAgent] = useState<CustomerAgent | null>(null);
  const [showSamplerDeck, setShowSamplerDeck] = useState(false);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. COMPACT OPERATIONAL HEADER (LEDGERIX CLARITY)                          */}
      {/* ========================================================================= */}
      <div className="space-y-2 border-b border-hairline pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textTertiary">
                CUSTOMER AGENTS · SYNTHETIC BEHAVIOURAL MODEL
              </span>
              <span className="text-textTertiary text-xs">•</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
                Calibrated (p &ge; 0.95)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
              Customer Agents
            </h1>
            <p className="text-xs text-textSecondary max-w-3xl leading-relaxed">
              Synthetic customer archetypes sampled from the merchant’s learned behavioural distributions. These autonomous actors model checkout patience, friction sensitivity, and retry propensity during Payment Twin simulation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setShowSamplerDeck(!showSamplerDeck)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-hairline bg-surface hover:bg-canvas text-textSecondary hover:text-textPrimary transition-colors shadow-xs"
            >
              <Sliders className="size-3.5 text-textTertiary" />
              <span>Resample Population</span>
              {showSamplerDeck ? (
                <ChevronUp className="size-3 text-textTertiary" />
              ) : (
                <ChevronDown className="size-3 text-textTertiary" />
              )}
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setActivePage("twin")}
              className="whitespace-nowrap shadow-sm text-xs font-medium"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              <span>Open Payment Twin</span>
            </Button>
          </div>
        </div>

        {/* Statistical Honesty & Provenance Disclaimer */}
        <div className="text-[11px] text-textTertiary bg-canvas/50 border border-hairline/60 rounded px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
          <span>
            {genResult?.population_metadata?.provenance_disclaimer ||
              "Customer Agents are calibrated synthetic actors derived from aggregate Behavioral DNA distributions, not direct individual customer records."}
          </span>
          <span className="font-mono text-[10px] text-textSecondary">
            Seed: {genResult?.population_metadata?.random_seed ?? randomSeed} · Version: 1.0.0
          </span>
        </div>
      </div>

      {/* Optional Collapsible Population Sampler Controls */}
      {showSamplerDeck && (
        <PopulationSynthesisDeck
          populationSize={populationSize}
          onPopulationSizeChange={setPopulationSize}
          randomSeed={randomSeed}
          onRandomSeedChange={setRandomSeed}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          profilingAvailable={dnaStatus?.profiling_available ?? true}
        />
      )}

      {/* Error Banner if generation fails */}
      {isError && (
        <ErrorAlert
          title="Agent Population Generation Failed"
          message={
            (error as Error)?.message ||
            "Failed to generate population. Ensure Behavioral DNA is available."
          }
        />
      )}

      {/* ========================================================================= */}
      {/* 2. AGENT POPULATION SUMMARY (CONTINUOUS ANALYTICAL RIBBON)                */}
      {/* ========================================================================= */}
      <AgentPopulationRibbon
        totalCount={totalCount}
        metadata={genResult?.population_metadata}
        diagnostics={genResult?.calibration_diagnostics}
        sourceDnaVersion="1.0.0"
      />

      {/* ========================================================================= */}
      {/* 3. DOMINANT ANALYTICAL SURFACE: ARCHETYPE DISTRIBUTION                    */}
      {/* ========================================================================= */}
      <AgentArchetypeSurface
        totalPopulation={totalCount}
        archetypeDistribution={archetypeDistribution}
        selectedArchetype={selectedArchetype}
        onSelectArchetype={setSelectedArchetype}
      />

      {/* ========================================================================= */}
      {/* 4. BEHAVIORAL FINGERPRINT & CHECKOUT DECISION PATHWAY                     */}
      {/* ========================================================================= */}
      <AgentFingerprintAndDecisions
        selectedArchetype={selectedArchetype}
      />

      {/* ========================================================================= */}
      {/* 5. SIMULATION PIPELINE BRIDGE (AGENT → PAYMENT TWIN)                      */}
      {/* ========================================================================= */}
      <AgentFunnelBridge />

      {/* ========================================================================= */}
      {/* 6. SAMPLE FORENSIC AGENT AUDIT TABLE (WITH SEARCH & DRILLDOWN)            */}
      {/* ========================================================================= */}
      {hasPopulation && genResult.preview_agents && genResult.preview_agents.length > 0 && (
        <AgentForensics
          agents={genResult.preview_agents}
          selectedArchetype={selectedArchetype}
          onSelectAgent={setSelectedAgent}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. DOWNSTREAM PAYMENT TWIN HANDOFF BRIDGE                                 */}
      {/* ========================================================================= */}
      <section className="rounded-lg border border-hairline bg-surface p-5 shadow-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-accent" strokeWidth={1.75} />
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
              Synthetic Population Ready for Simulation
            </h3>
            <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Stage 02 Active
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed">
            These {totalCount.toLocaleString()} calibrated agents form the autonomous customer population entering the Payment Twin engine. Simulate checkout funnels, payment routing, and retry policies to discover higher-margin operating points.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setActivePage("twin")}
          className="whitespace-nowrap self-start sm:self-center shadow-sm text-xs font-medium"
        >
          <span>Launch Payment Twin</span>
          <ArrowRight className="size-3.5 ml-1.5" />
        </Button>
      </section>

      {/* Slide-over Agent Inspector Drawer */}
      <AgentInspector
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};
