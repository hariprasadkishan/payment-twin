import React from "react";
import { Database, Key } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl">
      {/* Razorpay Connection Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-4">
        <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-cyan/10 border border-twin-cyan/20 text-twin-cyan">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-twin-white">
                Razorpay API Test Mode
              </h3>
              <p className="text-xs text-twin-slate">
                API Key credentials loaded from local environment.
              </p>
            </div>
          </div>
          <Badge variant="cyan" size="md">CONFIGURED</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/60 space-y-1">
            <span className="text-twin-slate">Target Account:</span>
            <div className="text-twin-white font-semibold truncate">rzp_test_51...</div>
          </div>
          <div className="p-3 rounded-lg bg-twin-card/50 border border-twin-border/60 space-y-1">
            <span className="text-twin-slate">Account Status:</span>
            <div className="text-twin-white font-semibold">Test Mode (0 Payments)</div>
          </div>
        </div>
      </div>

      {/* Dataset Foundation Auditing Card */}
      <div className="p-6 rounded-xl glass-panel border border-twin-border space-y-4">
        <div className="flex items-center justify-between border-b border-twin-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-twin-indigo/10 border border-twin-indigo/20 text-twin-indigo">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-twin-white">
                Dataset Repository & Provenance
              </h3>
              <p className="text-xs text-twin-slate">
                Sanitized payment records stored in local JSONL foundation.
              </p>
            </div>
          </div>
          <Badge variant="neutral" size="md">0 DATASETS</Badge>
        </div>

        <p className="text-xs text-twin-slate leading-relaxed">
          Payment Twin operates strictly on sanitized, redacted payment records. Zero customer PII (emails, phone numbers, card PANs) is ever logged or processed.
        </p>
      </div>
    </div>
  );
};
