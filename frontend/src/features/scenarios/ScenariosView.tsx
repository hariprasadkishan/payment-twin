import React, { useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { AttributionStepRow } from "@/components/domain/AttributionStepRow";
import { Button } from "@/components/ui/Button";

export const ScenariosView: React.FC = () => {
  const [upiRate, setUpiRate] = useState(88);
  const [routingShift, setRoutingShift] = useState(0);
  const [maxRetries, setMaxRetries] = useState(2);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Scenario Studio Levers Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-display font-semibold text-twin-white">
              Intervention Levers (Studio Preview)
            </h3>
            <p className="text-xs text-twin-slate">
              Configure counterfactual policies to simulate with Common Random Numbers (CRN).
            </p>
          </div>

          <div className="space-y-5">
            <Slider
              label="UPI Success Rate"
              value={upiRate}
              onChange={setUpiRate}
              min={50}
              max={100}
              unit="%"
            />
            <Slider
              label="Routing Shift to Cards"
              value={routingShift}
              onChange={setRoutingShift}
              min={-30}
              max={30}
              unit="%"
            />
            <Slider
              label="Max Retry Attempts"
              value={maxRetries}
              onChange={setMaxRetries}
              min={0}
              max={3}
              step={1}
            />
          </div>

          <Button variant="primary" size="sm" className="w-full" disabled>
            Simulate What-If Scenario (Requires DNA)
          </Button>
        </div>

        <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-twin-border space-y-4">
          <h3 className="text-sm font-display font-semibold text-twin-white">
            4-Tier Causal Attribution Trail Structure
          </h3>
          <p className="text-xs text-twin-slate">
            Every What-If run breaks down how operational changes cascade into net revenue outcomes.
          </p>

          <AttributionStepRow
            steps={[
              {
                tier: "DIRECT_LEVER",
                title: "Intervention Applied",
                description: "Shifted +15% traffic from degraded UPI to Cards.",
                metricDelta: "+15.0% Shift",
              },
              {
                tier: "FUNNEL_REACTION",
                title: "Funnel Behavioral Shift",
                description: "Agent friction dropped, reducing second-attempt dropouts.",
                metricDelta: "-4.2% Dropouts",
              },
              {
                tier: "CONVERSION_IMPACT",
                title: "Conversion Impact",
                description: "Net checkout capture rate increased on card rail.",
                metricDelta: "+2.8% Conversion",
              },
              {
                tier: "FINANCIAL_BOTTOM_LINE",
                title: "Financial Bottom Line",
                description: "Captured incremental GMV minus additional interchange MDR.",
                metricDelta: "+₹18,400 Net Rev",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
