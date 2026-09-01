import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { SimulationResult } from "@/types/simulation";

interface FunnelNode {
  id: string;
  label: string;
  xRatio: number; // 0.0 to 1.0
  yRatio: number; // 0.0 to 1.0
  count?: number;
  type?: "entry" | "funnel" | "method" | "terminal";
  statusColor?: string;
}

interface FunnelParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  progress: number; // 0.0 to 1.0
  stageIndex: number;
  method: "upi" | "card" | "netbanking";
  color: string;
  alpha: number;
  targetTerminal: "success" | "retry" | "fail" | "abandon";
}

export interface FunnelCanvasProps {
  simulationResult?: SimulationResult | null;
  isSimulating?: boolean;
  height?: number;
  className?: string;
}

export const FunnelCanvas: React.FC<FunnelCanvasProps> = ({
  simulationResult,
  isSimulating = false,
  height = 360,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<FunnelParticle[]>([]);

  // Funnel Node Geometry definition
  const nodes: FunnelNode[] = [
    { id: "landing", label: "01. Landing", xRatio: 0.08, yRatio: 0.5, type: "entry" },
    { id: "cart", label: "02. Cart", xRatio: 0.22, yRatio: 0.5, type: "funnel" },
    { id: "checkout", label: "03. Checkout", xRatio: 0.36, yRatio: 0.5, type: "funnel" },
    { id: "method", label: "04. Method", xRatio: 0.50, yRatio: 0.5, type: "method" },
    { id: "auth", label: "05. Auth / 3DS", xRatio: 0.64, yRatio: 0.5, type: "funnel" },
    { id: "gateway", label: "06. Gateway", xRatio: 0.78, yRatio: 0.5, type: "funnel" },
    // Terminal outcome nodes (stacked on the right)
    { id: "captured", label: "Captured", xRatio: 0.92, yRatio: 0.25, type: "terminal", statusColor: "#10B981" },
    { id: "retry", label: "Retried", xRatio: 0.92, yRatio: 0.45, type: "terminal", statusColor: "#F59E0B" },
    { id: "failed", label: "Declined", xRatio: 0.92, yRatio: 0.65, type: "terminal", statusColor: "#EF4444" },
    { id: "abandoned", label: "Abandoned", xRatio: 0.92, yRatio: 0.85, type: "terminal", statusColor: "#64748B" },
  ];

  // Map counts from simulationResult if present
  if (simulationResult && simulationResult.kpis) {
    const kpis = simulationResult.kpis;
    const dropoffs = simulationResult.funnel_dropoffs || {};
    
    nodes[0].count = kpis.total_agents;
    nodes[1].count = Math.max(0, kpis.total_agents - (dropoffs.browsing || 0));
    nodes[2].count = nodes[1].count;
    nodes[3].count = kpis.total_payment_attempts;
    nodes[4].count = kpis.total_payment_attempts;
    nodes[5].count = Math.max(0, kpis.total_payment_attempts - (dropoffs.auth_timeout || 0));
    nodes[6].count = kpis.successful_transactions;
    nodes[7].count = kpis.retry_attempts_count;
    nodes[8].count = kpis.failed_transactions;
    nodes[9].count = kpis.abandoned_transactions;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = container.clientWidth;
    canvas.width = width;
    canvas.height = height;

    const methodColors = {
      upi: "#06B6D4",        // Cyan
      card: "#6366F1",       // Indigo
      netbanking: "#F59E0B", // Amber
    };

    // Initialize particles
    const particleCount = isSimulating ? 160 : simulationResult ? 80 : 40;
    const particles: FunnelParticle[] = [];
    const methods: ("upi" | "card" | "netbanking")[] = ["upi", "card", "netbanking"];
    const terminals: ("success" | "retry" | "fail" | "abandon")[] = [
      "success", "success", "success", "retry", "fail", "abandon"
    ];

    for (let i = 0; i < particleCount; i++) {
      const method = methods[i % methods.length];
      const targetTerminal = terminals[i % terminals.length];
      particles.push({
        id: i,
        x: Math.random() * (width * 0.8),
        y: height * 0.5 + (Math.random() - 0.5) * 40,
        radius: Math.random() * 2.2 + 1.2,
        speed: Math.random() * 0.003 + 0.002,
        progress: Math.random(),
        stageIndex: Math.floor(Math.random() * 6),
        method,
        color: methodColors[method],
        alpha: Math.random() * 0.6 + 0.4,
        targetTerminal,
      });
    }
    particlesRef.current = particles;

    // Animation Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw connecting flow channels
      ctx.strokeStyle = "rgba(28, 37, 56, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Connect main pipeline
      for (let i = 0; i < 5; i++) {
        const n1 = nodes[i];
        const n2 = nodes[i + 1];
        ctx.beginPath();
        ctx.moveTo(n1.xRatio * width, n1.yRatio * height);
        ctx.lineTo(n2.xRatio * width, n2.yRatio * height);
        ctx.stroke();
      }

      // Connect Gateway to Terminal Outcomes
      const gatewayNode = nodes[5];
      for (let i = 6; i < 10; i++) {
        const termNode = nodes[i];
        ctx.beginPath();
        ctx.moveTo(gatewayNode.xRatio * width, gatewayNode.yRatio * height);
        ctx.lineTo(termNode.xRatio * width, termNode.yRatio * height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 2. Animate and Draw Agent Particles
      for (const p of particlesRef.current) {
        if (isSimulating || simulationResult) {
          p.progress += p.speed;
          if (p.progress > 1.0) {
            p.progress = 0.0;
          }
        }

        // Interpolate position along funnel
        let px = 0;
        let py = 0;

        if (p.progress < 0.8) {
          // Flowing through stages 0 to 5
          const stageProgress = p.progress / 0.8;
          px = width * (0.08 + stageProgress * 0.70);
          py = height * 0.5 + Math.sin(stageProgress * Math.PI * 4 + p.id) * 12;
        } else {
          // Diverging to terminal nodes
          const branchProgress = (p.progress - 0.8) / 0.2;
          const startX = width * 0.78;
          const startY = height * 0.5;

          let targetNode = nodes[6]; // Captured
          if (p.targetTerminal === "retry") targetNode = nodes[7];
          else if (p.targetTerminal === "fail") targetNode = nodes[8];
          else if (p.targetTerminal === "abandon") targetNode = nodes[9];

          const targetX = width * targetNode.xRatio;
          const targetY = height * targetNode.yRatio;

          px = startX + (targetX - startX) * branchProgress;
          py = startY + (targetY - startY) * branchProgress;
        }

        p.x = px;
        p.y = py;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw Funnel Stage Nodes
      for (const node of nodes) {
        const nx = node.xRatio * width;
        const ny = node.yRatio * height;

        ctx.save();
        // Node Background Box
        const isTerm = node.type === "terminal";
        const boxWidth = isTerm ? 95 : 85;
        const boxHeight = isTerm ? 26 : 38;

        ctx.fillStyle = isTerm ? "rgba(15, 20, 34, 0.95)" : "rgba(15, 20, 34, 0.85)";
        ctx.strokeStyle = node.statusColor || "rgba(28, 37, 56, 0.9)";
        ctx.lineWidth = 1;

        // Rounded rect
        const rx = nx - boxWidth / 2;
        const ry = ny - boxHeight / 2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, boxWidth, boxHeight, 6);
        ctx.fill();
        ctx.stroke();

        // Node Label
        ctx.fillStyle = "#F8FAFC";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, nx, isTerm ? ny : ny - 6);

        // Throughput count if available
        if (node.count !== undefined) {
          ctx.fillStyle = node.statusColor || "#06B6D4";
          ctx.font = "bold 11px 'Outfit', sans-serif";
          ctx.fillText(`${node.count.toLocaleString()}`, nx, isTerm ? ny : ny + 8);
        } else if (!isTerm) {
          ctx.fillStyle = "#64748B";
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillText("Standby", nx, ny + 8);
        }

        ctx.restore();
      }
    };

    gsap.ticker.add(render);

    const handleResize = () => {
      if (container) {
        canvas.width = container.clientWidth;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener("resize", handleResize);
    };
  }, [simulationResult, isSimulating, height]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full rounded-xl border border-twin-border bg-[#080B12] overflow-hidden shadow-2xl",
        className
      )}
    >
      <canvas ref={canvasRef} className="block w-full" style={{ height: `${height}px` }} />

      {/* Overlay Status Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="px-2 py-0.5 rounded text-[10px] font-mono border border-twin-border bg-twin-card/90 backdrop-blur-md text-twin-slate">
          ENGINE: <span className="text-twin-cyan font-bold">{isSimulating ? "RUNNING SIMULATION..." : "DISCRETE-EVENT ENGINE"}</span>
        </div>
      </div>
    </div>
  );
};
