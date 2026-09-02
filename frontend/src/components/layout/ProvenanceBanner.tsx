import React from "react";
import { Database, FlaskConical, Info } from "lucide-react";
import { ProvenanceType } from "@/types/provenance";
import { cn } from "@/lib/utils";

export interface ProvenanceBannerProps { provenance: ProvenanceType; dnaVersion?: string; sampleSize?: number; className?: string }
export const ProvenanceBanner: React.FC<ProvenanceBannerProps> = ({ provenance, dnaVersion = "1.0.0", sampleSize = 0, className }) => {
  const content = provenance === "OBSERVED_RAZORPAY_DATA"
    ? { icon: Database, label: "Observed Razorpay data", text: `Calibrated on ${sampleSize ? `${sampleSize.toLocaleString()} verified merchant transactions` : "merchant transactions"} from Razorpay Test Mode (DNA v${dnaVersion}).`, tone: "text-[#237b4b] bg-[#e9f5ee] border-[#c8e5d3]" }
    : provenance === "SYNTHETIC_BENCHMARK_DATA"
      ? { icon: FlaskConical, label: "Synthetic benchmark", text: `${sampleSize ? `${sampleSize.toLocaleString()} aggregate benchmark records` : "Benchmark records"} power this workspace. Simulation outputs are projections, not merchant observations.`, tone: "text-[#455ca4] bg-[#eef1fa] border-[#d6dcf0]" }
      : provenance === "MIXED_DERIVED"
        ? { icon: FlaskConical, label: "Simulation projection", text: "These forward estimates are derived from the current Customer Agent model and scenario assumptions.", tone: "text-[#455ca4] bg-[#eef1fa] border-[#d6dcf0]" }
        : { icon: Info, label: "Awaiting data", text: "Connect Razorpay Test Mode or load the synthetic benchmark in Settings to begin analysis.", tone: "text-[#5e6963] bg-[#f0f1ee] border-[#e2e4df]" };
  const Icon = content.icon;
  return <aside aria-label="Data provenance" className={cn("mb-6 flex items-start gap-2.5 border px-3 py-2.5 text-xs leading-5", content.tone, className)}><Icon className="mt-0.5 size-3.5 shrink-0" /><p><strong className="font-semibold">{content.label}.</strong> {content.text}</p></aside>;
};
