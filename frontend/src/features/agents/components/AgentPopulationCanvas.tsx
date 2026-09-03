import React, { useRef, useEffect, useState, useCallback } from "react";
import { AgentArchetype, CustomerAgent } from "@/types/agent";

interface AgentPopulationCanvasProps {
  populationSize: number;
  randomSeed: number;
  archetypeDistribution?: Record<string, number> | null;
  selectedArchetype: AgentArchetype | "ALL" | null;
  onSelectArchetype: (arch: AgentArchetype | "ALL") => void;
  previewAgents?: CustomerAgent[];
  onSelectAgent?: (agent: CustomerAgent) => void;
  isGenerating?: boolean;
}

interface AgentPoint {
  id: string;
  x: number; // friction_sensitivity (0 to 1)
  y: number; // retry_propensity (0 to 1)
  amount: number;
  archetype: AgentArchetype;
  method: string;
}

// Seeded PRNG for deterministic rendering
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const AgentPopulationCanvas: React.FC<AgentPopulationCanvasProps> = ({
  populationSize,
  randomSeed,
  archetypeDistribution,
  selectedArchetype,
  onSelectArchetype,
  previewAgents,
  onSelectAgent,
  isGenerating,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 310 });
  const [hoveredPoint, setHoveredPoint] = useState<AgentPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<AgentPoint[]>([]);

  const archetypeColors: Record<AgentArchetype, string> = {
    FAST_CHECKOUT: "#0284c7",   // Sky Blue
    PATIENT_RETRYER: "#4f46e5", // Indigo
    METHOD_SWITCHER: "#d97706", // Amber
    HIGH_TICKET: "#059669",     // Emerald
  };

  // Generate or align population coordinates
  const initPoints = useCallback(() => {
    const rng = mulberry32(randomSeed || 42);
    const count = Math.min(populationSize || 1000, 800); // 800 discrete sample markers for high density
    const pts: AgentPoint[] = [];

    // Use preview agents if available
    if (previewAgents && previewAgents.length > 0) {
      previewAgents.forEach((a) => {
        pts.push({
          id: a.agent_id,
          x: a.latent_parameters.friction_sensitivity,
          y: a.latent_parameters.retry_propensity,
          amount: a.observed_preferences.transaction_amount_inr,
          archetype: a.archetype,
          method: a.observed_preferences.primary_method,
        });
      });
    }

    // Fill remaining population based on calibrated distributions
    const remaining = count - pts.length;
    if (remaining > 0) {
      const archetypes: AgentArchetype[] = [
        "FAST_CHECKOUT",
        "PATIENT_RETRYER",
        "METHOD_SWITCHER",
        "HIGH_TICKET",
      ];

      const centers: Record<AgentArchetype, { xMean: number; yMean: number; xSigma: number; ySigma: number; method: string }> = {
        FAST_CHECKOUT: { xMean: 0.82, yMean: 0.18, xSigma: 0.08, ySigma: 0.07, method: "upi" },
        PATIENT_RETRYER: { xMean: 0.32, yMean: 0.78, xSigma: 0.09, ySigma: 0.08, method: "card" },
        METHOD_SWITCHER: { xMean: 0.65, yMean: 0.62, xSigma: 0.10, ySigma: 0.09, method: "upi" },
        HIGH_TICKET: { xMean: 0.22, yMean: 0.42, xSigma: 0.08, ySigma: 0.09, method: "card" },
      };

      const totalPop = populationSize || 1000;
      archetypes.forEach((arch) => {
        const archQuota = Math.round(
          ((archetypeDistribution?.[arch] ?? (totalPop * 0.25)) / totalPop) * remaining
        );
        const cfg = centers[arch];

        for (let i = 0; i < archQuota; i++) {
          const u1 = Math.max(0.0001, rng());
          const u2 = rng();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

          const x = Math.max(0.04, Math.min(0.96, cfg.xMean + z0 * cfg.xSigma));
          const y = Math.max(0.04, Math.min(0.96, cfg.yMean + z1 * cfg.ySigma));
          const amount = arch === "HIGH_TICKET" ? 2500 + rng() * 8000 : 200 + rng() * 1800;

          pts.push({
            id: `agent_${pts.length + 1}`,
            x,
            y,
            amount,
            archetype: arch,
            method: cfg.method,
          });
        }
      });
    }

    pointsRef.current = pts;
  }, [populationSize, randomSeed, archetypeDistribution, previewAgents]);

  // Track Dimensions - Reduced vertical dominance to 310px height
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      setDimensions({
        width: containerRef.current.clientWidth || 800,
        height: 310,
      });
    };

    handleResize();
    initPoints();

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [initPoints]);

  // Draw High-Density Fintech Matrix
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = dimensions;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Padding margins for axes
    const margin = { top: 18, right: 24, bottom: 36, left: 52 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;


    // Background fill
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Quadrant Subtle Tinting
    // Top-Left: Low Friction, High Retry (Patient)
    ctx.fillStyle = "#faf5ff";
    ctx.fillRect(margin.left, margin.top, plotWidth / 2, plotHeight / 2);

    // Top-Right: High Friction, High Retry (Switchers)
    ctx.fillStyle = "#fffbeb";
    ctx.fillRect(margin.left + plotWidth / 2, margin.top, plotWidth / 2, plotHeight / 2);

    // Bottom-Left: Low Friction, Low Retry (High Ticket)
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(margin.left, margin.top + plotHeight / 2, plotWidth / 2, plotHeight / 2);

    // Bottom-Right: High Friction, Low Retry (Fast Checkout)
    ctx.fillStyle = "#f0f9ff";
    ctx.fillRect(margin.left + plotWidth / 2, margin.top + plotHeight / 2, plotWidth / 2, plotHeight / 2);

    // Grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // Draw Plot Boundary
    ctx.strokeRect(margin.left, margin.top, plotWidth, plotHeight);

    // Subtle Grid Divisors
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#d1d5db";

    // Mid vertical
    ctx.beginPath();
    ctx.moveTo(margin.left + plotWidth / 2, margin.top);
    ctx.lineTo(margin.left + plotWidth / 2, margin.top + plotHeight);
    ctx.stroke();

    // Mid horizontal
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight / 2);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrant Corner Micro-Labels
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";

    ctx.textAlign = "left";
    ctx.fillText("High Retry / Low Friction (Patient)", margin.left + 8, margin.top + 16);
    ctx.fillText("Low Retry / Low Friction (High Ticket)", margin.left + 8, margin.top + plotHeight - 8);

    ctx.textAlign = "right";
    ctx.fillText("High Retry / High Friction (Switchers)", margin.left + plotWidth - 8, margin.top + 16);
    ctx.fillText("Low Retry / High Friction (Fast Checkout)", margin.left + plotWidth - 8, margin.top + plotHeight - 8);

    // Axis Tick Labels
    ctx.textAlign = "center";
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px Inter, tabular-nums, sans-serif";

    // X-Axis Ticks: 0%, 25%, 50%, 75%, 100%
    const xTicks = [0, 0.25, 0.5, 0.75, 1.0];
    xTicks.forEach((t) => {
      const px = margin.left + t * plotWidth;
      ctx.fillText(`${Math.round(t * 100)}%`, px, margin.top + plotHeight + 18);
    });

    // Y-Axis Ticks: 0%, 25%, 50%, 75%, 100%
    ctx.textAlign = "right";
    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
    yTicks.forEach((t) => {
      const py = margin.top + plotHeight - t * plotHeight;
      ctx.fillText(`${Math.round(t * 100)}%`, margin.left - 10, py + 4);
    });

    // Axis Titles
    ctx.fillStyle = "#4b5563";
    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Friction Sensitivity (Abandonment Propensity on Latency / 2FA) →",
      margin.left + plotWidth / 2,
      margin.top + plotHeight + 36
    );

    ctx.save();
    ctx.translate(margin.left - 36, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Retry Propensity (Commitment to Retry) →", 0, 0);
    ctx.restore();

    // Render Data Points
    const pts = pointsRef.current;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const isFocused =
        selectedArchetype === "ALL" ||
        selectedArchetype === null ||
        selectedArchetype === p.archetype;

      const px = margin.left + p.x * plotWidth;
      const py = margin.top + plotHeight - p.y * plotHeight;

      ctx.beginPath();
      ctx.arc(px, py, isFocused ? 2.5 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = archetypeColors[p.archetype];
      ctx.globalAlpha = isFocused ? 0.75 : 0.12;
      ctx.fill();

      // Border for focused points
      if (isFocused) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // Centroid Markers
    const centroids: Record<AgentArchetype, { x: number; y: number; label: string }> = {
      FAST_CHECKOUT: { x: 0.82, y: 0.18, label: "Fast Checkout" },
      PATIENT_RETRYER: { x: 0.32, y: 0.78, label: "Patient Retryer" },
      METHOD_SWITCHER: { x: 0.65, y: 0.62, label: "Method Switcher" },
      HIGH_TICKET: { x: 0.22, y: 0.42, label: "High Ticket" },
    };

    (Object.keys(centroids) as AgentArchetype[]).forEach((arch) => {
      const c = centroids[arch];
      const isFocused =
        selectedArchetype === "ALL" || selectedArchetype === null || selectedArchetype === arch;

      const cx = margin.left + c.x * plotWidth;
      const cy = margin.top + plotHeight - c.y * plotHeight;
      const color = archetypeColors[arch];

      // Outer target ring
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = isFocused ? 0.9 : 0.2;
      ctx.stroke();

      // Center solid dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Centroid Tag Pill
      if (isFocused) {
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        const textWidth = ctx.measureText(c.label).width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        const pillX = cx - textWidth / 2 - 6;
        const pillY = cy - 22;
        ctx.fillRect(pillX, pillY, textWidth + 12, 16);
        ctx.strokeRect(pillX, pillY, textWidth + 12, 16);

        ctx.fillStyle = "#111827";
        ctx.fillText(c.label, cx, cy - 10);
      }
      ctx.globalAlpha = 1.0;
    });
  }, [dimensions, selectedArchetype]);

  // Handle Mouse Hover on Canvas for Inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    const margin = { top: 18, right: 24, bottom: 36, left: 52 };
    const plotWidth = dimensions.width - margin.left - margin.right;
    const plotHeight = dimensions.height - margin.top - margin.bottom;

    // Convert mouse to normalized coords
    const normX = (x - margin.left) / plotWidth;
    const normY = 1 - (y - margin.top) / plotHeight;

    if (normX < 0 || normX > 1 || normY < 0 || normY > 1) {
      setHoveredPoint(null);
      return;
    }

    // Find nearest point within proximity
    let nearest: AgentPoint | null = null;
    let minDist = 0.05; // search radius

    for (const p of pointsRef.current) {
      const dx = p.x - normX;
      const dy = p.y - normY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    setHoveredPoint(nearest);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePos(null);
  };

  const handleClick = () => {
    if (hoveredPoint && previewAgents) {
      const matched = previewAgents.find((a) => a.agent_id === hoveredPoint.id);
      if (matched && onSelectAgent) {
        onSelectAgent(matched);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border border-hairline bg-surface p-4 shadow-panel space-y-2.5"
    >
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-textPrimary tracking-tight">
              Behavioral Distribution Matrix
            </h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-hairline bg-subtle text-textSecondary">
              N = {populationSize.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-textSecondary">
            Bivariate spatial clustering: Friction Sensitivity ($X$) vs. Retry Propensity ($Y$). Click cohorts to isolate.
          </p>
        </div>

        {/* Quadrant Legend Quick Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-textTertiary">
          <button
            type="button"
            onClick={() => onSelectArchetype("FAST_CHECKOUT")}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-hairline bg-surface hover:bg-subtle text-textSecondary transition-colors"
          >
            <span className="size-2 rounded-full bg-sky-500" />
            <span>Fast Checkout</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectArchetype("PATIENT_RETRYER")}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-hairline bg-surface hover:bg-subtle text-textSecondary transition-colors"
          >
            <span className="size-2 rounded-full bg-indigo-600" />
            <span>Patient Retryer</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectArchetype("METHOD_SWITCHER")}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-hairline bg-surface hover:bg-subtle text-textSecondary transition-colors"
          >
            <span className="size-2 rounded-full bg-amber-600" />
            <span>Method Switcher</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectArchetype("HIGH_TICKET")}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-hairline bg-surface hover:bg-subtle text-textSecondary transition-colors"
          >
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>High Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative overflow-hidden rounded-md border border-hairline bg-surface">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="cursor-crosshair block"
        />

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-surface/75 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-2 text-xs font-medium text-accent">
            <div className="size-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span>Sampling probabilistic customer actors from Behavioral DNA...</span>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredPoint && mousePos && (
          <div
            className="pointer-events-none fixed z-50 rounded-md border border-hairline bg-surface/95 px-3 py-2 text-xs shadow-dropdown backdrop-blur-sm space-y-1"
            style={{
              left: mousePos.x + 12,
              top: mousePos.y - 40,
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: archetypeColors[hoveredPoint.archetype] }}
              />
              <span>{hoveredPoint.id}</span>
              <span className="text-[10px] text-textTertiary font-normal">
                ({hoveredPoint.archetype.replace(/_/g, " ")})
              </span>
            </div>
            <div className="text-[11px] text-textSecondary space-y-0.5 tabular-nums">
              <div>Friction Sensitivity: <strong>{(hoveredPoint.x * 100).toFixed(1)}%</strong></div>
              <div>Retry Propensity: <strong>{(hoveredPoint.y * 100).toFixed(1)}%</strong></div>
              <div>Order Basket: <strong>₹{hoveredPoint.amount.toFixed(0)}</strong> ({hoveredPoint.method})</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

