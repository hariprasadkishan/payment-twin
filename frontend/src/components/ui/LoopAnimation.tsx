import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoopAnimationProps {
  status?: "active" | "warning" | "danger" | "idle";
  label?: string;
  className?: string;
}

/**
 * Skiper 62 — Loop Animation Component (Free Tier).
 * Continuous pulse and activity loop for live Sentinel surveillance and active simulation indicators.
 */
export const LoopAnimation: React.FC<LoopAnimationProps> = ({
  status = "active",
  label,
  className,
}) => {
  const colorMap = {
    active: "bg-twin-cyan text-twin-cyan border-twin-cyan/30 shadow-twin-cyan/20",
    warning: "bg-twin-warning text-twin-warning border-twin-warning/30 shadow-twin-warning/20",
    danger: "bg-twin-danger text-twin-danger border-twin-danger/30 shadow-twin-danger/20",
    idle: "bg-twin-slate text-twin-slate border-twin-slate/30 shadow-twin-slate/20",
  };

  const dotColorMap = {
    active: "bg-twin-cyan",
    warning: "bg-twin-warning",
    danger: "bg-twin-danger",
    idle: "bg-twin-slate",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border backdrop-blur-sm",
        colorMap[status],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <motion.span
          className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColorMap[status])}
          animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColorMap[status])} />
      </span>
      {label && <span className="text-twin-white/90 font-medium">{label}</span>}
    </div>
  );
};
