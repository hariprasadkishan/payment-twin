import React from "react";
import { KPIMetricCard } from "@/components/domain/KPIMetricCard";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export const OverviewView: React.FC = () => {
  const { setActivePage } = useAppStore();

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Topline KPI Metric Grid (Honest Empty State) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIMetricCard
          title="Overall Conversion"
          isUnavailable={true}
          tooltipText="Percentage of initiated checkouts resulting in captured payments."
        />
        <KPIMetricCard
          title="Captured Volume"
          isUnavailable={true}
          tooltipText="Total successful gross merchandise value."
        />
        <KPIMetricCard
          title="Gateway Processing Fees"
          isUnavailable={true}
          tooltipText="Total processing fees incurred across payment rails."
        />
        <KPIMetricCard
          title="Average Attempts"
          isUnavailable={true}
          tooltipText="Average payment attempts per unique transaction order."
        />
      </div>

      {/* Main Command Center Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-twin-border space-y-6">
          <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-display font-semibold text-twin-white">
                Payment Twin Onboarding
              </h2>
              <p className="text-xs text-twin-slate">
                Connect Razorpay Test Mode to establish your Behavioral DNA baseline.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-twin-card border border-twin-border text-twin-slate">
              SETUP REQUIRED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-twin-card/40 border border-twin-border/60 space-y-2">
              <div className="flex items-center gap-2 text-twin-cyan font-mono text-xs">
                <span className="w-5 h-5 rounded-full bg-twin-cyan/15 flex items-center justify-center font-bold">1</span>
                <span>Ingest Data</span>
              </div>
              <p className="text-[11px] text-twin-slate">
                Sync recent payments from Razorpay Test Mode.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-twin-card/40 border border-twin-border/60 space-y-2">
              <div className="flex items-center gap-2 text-twin-indigo font-mono text-xs">
                <span className="w-5 h-5 rounded-full bg-twin-indigo/15 flex items-center justify-center font-bold">2</span>
                <span>Profile DNA</span>
              </div>
              <p className="text-[11px] text-twin-slate">
                Extract empirical method priors & success dynamics.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-twin-card/40 border border-twin-border/60 space-y-2">
              <div className="flex items-center gap-2 text-twin-success font-mono text-xs">
                <span className="w-5 h-5 rounded-full bg-twin-success/15 flex items-center justify-center font-bold">3</span>
                <span>Simulate & Protect</span>
              </div>
              <p className="text-[11px] text-twin-slate">
                Run What-If scenarios & activate Guardian surveillance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" size="sm" onClick={() => setActivePage("settings")}>
              Go to Data & Settings →
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setActivePage("dna")}>
              Inspect DNA Baseline
            </Button>
          </div>
        </div>

        {/* Guardian Sentinel Status Card */}
        <div className="p-6 rounded-xl glass-panel border border-twin-border flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-twin-slate uppercase tracking-wider">
                Guardian Sentinel
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-twin-slate/10 text-twin-slate border border-twin-border">
                STANDBY
              </span>
            </div>
            <h3 className="text-sm font-display font-semibold text-twin-white">
              Statistical Surveillance
            </h3>
            <p className="text-xs text-twin-slate leading-relaxed">
              Monitors telemetry drift using PSI, Z-tests, and CUSUM with False Discovery Rate (FDR) control.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/60 text-xs font-mono text-twin-slate space-y-1">
            <div className="flex justify-between">
              <span>Active Alerts:</span>
              <span className="text-twin-white font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span>Drift Gate:</span>
              <span className="text-twin-cyan">Dual Significance</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => setActivePage("guardian")}>
            Open Sentinel View
          </Button>
        </div>
      </div>
    </div>
  );
};
