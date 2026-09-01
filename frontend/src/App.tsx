import { useState } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Layers 
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { TextRoll } from "@/components/ui/TextRoll";
import { LoopAnimation } from "@/components/ui/LoopAnimation";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { CanvasCrowdBase } from "@/components/ui/CanvasCrowdBase";

export default function App() {
  const [metricValue, setMetricValue] = useState(88.4);

  return (
    <div className="min-h-screen bg-twin-bg text-twin-white p-8 max-w-7xl mx-auto space-y-12">
      <ScrollProgress />

      {/* Header & Brand Identity */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-twin-border">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-cyan/10 border border-twin-cyan/20 text-twin-cyan">
              <Cpu className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              PAYMENT <span className="text-twin-cyan">TWIN</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-twin-border bg-twin-card font-mono text-twin-slate">
              v1.0.0 Foundation
            </span>
          </div>
          <p className="text-sm text-twin-slate">
            Step 10B.1: Design System Tokens & Free Component Foundation Layer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LoopAnimation status="active" label="SURVEILLANCE READY" />
          <div className="text-xs px-3 py-1 rounded-md border border-twin-border bg-twin-card font-mono text-twin-slate">
            PROVENANCE: <span className="text-twin-white font-medium">OBSERVED</span>
          </div>
        </div>
      </header>

      {/* Design System Token Showcase */}
      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-twin-cyan" />
          1. Color Tokens & Surface Hierarchy
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl border border-twin-border bg-twin-bg space-y-1">
            <span className="text-xs font-mono text-twin-slate">Background</span>
            <div className="text-xs font-mono font-bold text-twin-white">#080B11</div>
          </div>
          <div className="p-4 rounded-xl border border-twin-border bg-twin-card space-y-1">
            <span className="text-xs font-mono text-twin-slate">Card Surface</span>
            <div className="text-xs font-mono font-bold text-twin-white">#0F1422</div>
          </div>
          <div className="p-4 rounded-xl border border-twin-cyan/30 bg-twin-cyan/10 space-y-1">
            <span className="text-xs font-mono text-twin-cyan">Primary Cyan</span>
            <div className="text-xs font-mono font-bold text-twin-cyan">#06B6D4</div>
          </div>
          <div className="p-4 rounded-xl border border-twin-indigo/30 bg-twin-indigo/10 space-y-1">
            <span className="text-xs font-mono text-twin-indigo">Accent Indigo</span>
            <div className="text-xs font-mono font-bold text-twin-indigo">#6366F1</div>
          </div>
          <div className="p-4 rounded-xl border border-twin-success/30 bg-twin-success/10 space-y-1">
            <span className="text-xs font-mono text-twin-success">Success Emerald</span>
            <div className="text-xs font-mono font-bold text-twin-success">#10B981</div>
          </div>
          <div className="p-4 rounded-xl border border-twin-danger/30 bg-twin-danger/10 space-y-1">
            <span className="text-xs font-mono text-twin-danger">Danger Crimson</span>
            <div className="text-xs font-mono font-bold text-twin-danger">#EF4444</div>
          </div>
        </div>
      </section>

      {/* Free Skiper Component Verifications */}
      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-twin-indigo" />
          2. Free Skiper UI Component Verifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Skiper 37: Animated Number */}
          <div className="p-6 rounded-xl glass-panel glass-panel-hover space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-twin-slate">Skiper 37 — Animated Counter</span>
              <button 
                onClick={() => setMetricValue(prev => (prev > 90 ? 84.5 : prev + 3.2))}
                className="text-xs px-2 py-0.5 rounded bg-twin-cyan/20 text-twin-cyan hover:bg-twin-cyan/30 transition-colors"
              >
                Update
              </button>
            </div>
            <div className="text-3xl text-twin-cyan">
              <AnimatedNumber value={metricValue} suffix="%" decimals={1} />
            </div>
            <p className="text-xs text-twin-slate">Smooth spring-based KPI numerical counter.</p>
          </div>

          {/* Skiper 58: Text Roll */}
          <div className="p-6 rounded-xl glass-panel glass-panel-hover space-y-3">
            <span className="text-xs font-mono text-twin-slate">Skiper 58 — Text Roll</span>
            <div className="text-xl font-display font-semibold">
              <TextRoll>Explore Pareto Frontier →</TextRoll>
            </div>
            <p className="text-xs text-twin-slate">Micro-interaction text rolling effect on hover.</p>
          </div>

          {/* Skiper 62: Loop Animation */}
          <div className="p-6 rounded-xl glass-panel glass-panel-hover space-y-3">
            <span className="text-xs font-mono text-twin-slate">Skiper 62 — Loop Activity</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <LoopAnimation status="active" label="SIMULATING" />
              <LoopAnimation status="warning" label="DRIFT DETECTED" />
            </div>
            <p className="text-xs text-twin-slate">Continuous pulse loop for active Sentinel telemetry.</p>
          </div>
        </div>
      </section>

      {/* Skiper 39: Canvas Crowd Simulation Foundation */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-twin-cyan" />
            3. Skiper 39 — Canvas Particle Crowd Engine (Agent Simulation Base)
          </h2>
          <span className="text-xs font-mono text-twin-slate">
            60 FPS Generative Canvas 2D + GSAP Ticker
          </span>
        </div>
        <p className="text-xs text-twin-slate">
          High-performance generative particle foundation to be adapted in Step 10D for Customer Agent funnel flows.
        </p>
        <CanvasCrowdBase particleCount={150} height={220} />
      </section>

      {/* Next Step Roadmap */}
      <footer className="p-6 rounded-xl border border-twin-border bg-twin-card/30 space-y-2">
        <h3 className="text-sm font-semibold text-twin-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-twin-success" />
          Foundation Status & Implementation Sequence
        </h3>
        <p className="text-xs text-twin-slate leading-relaxed">
          Step 10B.1 foundation is established. No feature UI screens (Command Center, Guardian, DNA, What-If, Pareto) have been built yet.
          The backend remains 100% untouched and clean.
        </p>
      </footer>
    </div>
  );
}
