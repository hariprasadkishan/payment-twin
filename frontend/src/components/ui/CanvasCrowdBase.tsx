import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export interface AgentParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  archetype: "SPEED" | "CAUTIOUS" | "RELUCTANT" | "PREMIUM";
  method: "upi" | "card" | "netbanking";
}

interface CanvasCrowdBaseProps {
  particleCount?: number;
  width?: number;
  height?: number;
  className?: string;
  isSimulating?: boolean;
}

/**
 * Skiper 39 — Canvas Crowd Foundation Component (Free Tier).
 * High-performance 2D Canvas + GSAP Ticker animation engine designed for
 * simulating hundreds of synthetic Customer Agents across payment funnel stages.
 * 
 * Note: Uses generative procedural canvas drawing to avoid external sprite dependencies.
 */
export const CanvasCrowdBase: React.FC<CanvasCrowdBaseProps> = ({
  particleCount = 120,
  width = 800,
  height = 300,
  className,
  isSimulating = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<AgentParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Method Color Palette matching Payment Twin tokens
    const methodColors = {
      upi: "#06B6D4",        // Cyan
      card: "#6366F1",       // Indigo
      netbanking: "#F59E0B", // Amber
    };

    const archetypes: AgentParticle["archetype"][] = ["SPEED", "CAUTIOUS", "RELUCTANT", "PREMIUM"];
    const methods: AgentParticle["method"][] = ["upi", "card", "netbanking"];

    // Initialize particles
    const particles: AgentParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const method = methods[i % methods.length];
      particles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1.5,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        color: methodColors[method],
        alpha: Math.random() * 0.5 + 0.5,
        archetype: archetypes[i % archetypes.length],
        method,
      });
    }
    particlesRef.current = particles;

    // GSAP Ticker animation loop (60 FPS)
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle flow
      for (const p of particlesRef.current) {
        if (isSimulating) {
          p.x += p.vx;
          p.y += p.vy;

          // Boundary bouncing
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
    };
  }, [particleCount, width, height, isSimulating]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-twin-border bg-twin-card/50", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
