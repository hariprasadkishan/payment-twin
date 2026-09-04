import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { 
  ArrowDown, 
  ArrowRight, 
  Database, 
  Dna, 
  Users, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface IntelligencePipelineIntroProps {
  onEnterWorkspace: () => void;
}

export const IntelligencePipelineIntro: React.FC<IntelligencePipelineIntroProps> = ({
  onEnterWorkspace,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check for user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        // Show final state immediately
        gsap.set([titleRef.current, subtitleRef.current, pipelineRef.current, ctaRef.current], {
          opacity: 1,
          y: 0,
        });
        const items = containerRef.current?.querySelectorAll(".intro-step-card");
        const connectors = containerRef.current?.querySelectorAll(".intro-connector");
        if (items) gsap.set(items, { opacity: 1, y: 0 });
        if (connectors) gsap.set(connectors, { opacity: 1, scaleY: 1 });
        return;
      }

      // Editorial GSAP Timeline
      const tl = gsap.timeline({
        defaults: { ease: "power2.out", duration: 0.45 },
      });

      // 1. Reveal Master Heading & Tagline
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55 }
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.2"
      );

      // 2. Progressively reveal the 4 pipeline steps and connectors
      const steps = [
        { card: ".intro-step-1", connector: ".intro-connector-1" },
        { card: ".intro-step-2", connector: ".intro-connector-2" },
        { card: ".intro-step-3", connector: ".intro-connector-3" },
        { card: ".intro-step-4", connector: null },
      ];

      steps.forEach(({ card, connector }, idx) => {
        tl.fromTo(
          card,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35 },
          idx === 0 ? "+=0.1" : "-=0.1"
        );

        if (connector) {
          tl.fromTo(
            connector,
            { opacity: 0, scaleY: 0 },
            { opacity: 1, scaleY: 1, duration: 0.25, transformOrigin: "top center" },
            "-=0.1"
          );
        }
      });

      // 3. Reveal Call-to-Action
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4 },
        "+=0.1"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const pipelineSteps = [
    {
      id: "step-1",
      stepNum: "01",
      stage: "OBSERVE",
      title: "Behavioral Payment Patterns",
      icon: Database,
      detail: "Learned from Razorpay test transactions, payment method distribution, and checkout timing telemetry.",
      tone: "border-hairline bg-surface text-textPrimary",
      badge: "Observed Data",
      badgeTone: "border-hairline bg-subtle text-textSecondary",
      cardClass: "intro-step-1",
      connectorClass: "intro-connector-1",
    },
    {
      id: "step-2",
      stepNum: "02",
      stage: "LEARN",
      title: "Behavioral DNA",
      icon: Dna,
      detail: "Statistical distributions parameterized for payment method mix, retry propensity, and terminal failure rates.",
      tone: "border-hairline bg-surface text-textPrimary",
      badge: "Statistical Baseline",
      badgeTone: "border-hairline bg-subtle text-textSecondary",
      cardClass: "intro-step-2",
      connectorClass: "intro-connector-2",
    },
    {
      id: "step-3",
      stepNum: "03",
      stage: "GENERATE",
      title: "Synthetic Customer Agents",
      icon: Users,
      detail: "Autonomous population of 1,000 synthetic agents calibrated to realistic merchant customer checkout dynamics.",
      tone: "border-hairline bg-surface text-textPrimary",
      badge: "1,000 Agents",
      badgeTone: "border-hairline bg-subtle text-textSecondary",
      cardClass: "intro-step-3",
      connectorClass: "intro-connector-3",
    },
    {
      id: "step-4",
      stepNum: "04",
      stage: "SIMULATE",
      title: "Payment Journeys",
      icon: Sparkles,
      detail: "Discrete-event simulation modeling dropouts, 3DS authentication friction, network retries, and captured revenue.",
      tone: "border-indigo-200 bg-indigo-50/40 text-textPrimary",
      badge: "Discrete Event Simulation",
      badgeTone: "border-indigo-200 bg-indigo-100 text-accent",
      cardClass: "intro-step-4",
      connectorClass: null,
    },
  ];

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-hairline bg-surface p-6 sm:p-10 shadow-panel space-y-8 max-w-5xl mx-auto"
    >
      {/* Top Editorial Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-hairline bg-subtle text-[11px] font-mono text-textSecondary">
          <span className="size-1.5 rounded-full bg-accent" />
          <span>Intelligence Pipeline</span>
        </div>

        <h1
          ref={titleRef}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-textPrimary uppercase"
          style={{ letterSpacing: "-0.03em" }}
        >
          Payment Twin
        </h1>

        <p
          ref={subtitleRef}
          className="text-base sm:text-lg text-textSecondary font-medium leading-relaxed"
        >
          &ldquo;Simulate what could happen.&rdquo;
        </p>
      </div>

      {/* Progressive 4-Step Pipeline */}
      <div ref={pipelineRef} className="space-y-3 max-w-3xl mx-auto">
        {pipelineSteps.map((step) => {
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <div
                className={`intro-step-card ${step.cardClass} p-4 sm:p-5 rounded-md border ${step.tone} shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="size-9 rounded-md border border-hairline bg-canvas flex items-center justify-center shrink-0 text-accent shadow-xs">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold tracking-wider text-textTertiary uppercase">
                        {step.stepNum} · {step.stage}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border ${step.badgeTone}`}>
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-textPrimary tracking-tight">
                      {step.title}
                    </h3>

                    <p className="text-xs text-textSecondary leading-normal">
                      {step.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-textTertiary">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Calibrated</span>
                  </span>
                </div>
              </div>

              {/* Downward Connector Arrow */}
              {step.connectorClass && (
                <div
                  className={`intro-connector ${step.connectorClass} flex justify-center py-1`}
                >
                  <div className="flex flex-col items-center gap-0.5 text-textTertiary">
                    <div className="w-px h-3 bg-hairline" />
                    <ArrowDown className="size-3 text-textTertiary" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Action Footer */}
      <div
        ref={ctaRef}
        className="pt-4 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div className="text-textTertiary text-center sm:text-left text-[11px] font-mono">
          <span>Common Random Numbers (CRN) isolates causal intervention variance.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={onEnterWorkspace}
            className="shadow-sm gap-2 font-semibold bg-accent hover:bg-accent/90"
          >
            <span>Enter Simulation Workspace</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
