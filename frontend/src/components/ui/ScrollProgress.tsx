import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  className?: string;
}

/**
 * Skiper 89 — Scroll Progress Component (Free Tier).
 * Responsive linear indicator tracking analytical page scroll depth.
 */
export const ScrollProgress: React.FC<ScrollProgressProps> = ({ className }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-twin-cyan via-twin-indigo to-twin-cyan origin-left z-50",
        className
      )}
      style={{ scaleX }}
    />
  );
};
