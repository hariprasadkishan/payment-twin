import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextRollProps {
  children: string;
  className?: string;
}

/**
 * Skiper 58 — Text Roll Component (Free Tier).
 * Micro-interaction text rolling effect for navigation badges, section titles, and status transitions.
 */
export const TextRoll: React.FC<TextRollProps> = ({ children, className }) => {
  return (
    <motion.span
      className={cn("relative inline-block overflow-hidden cursor-pointer", className)}
      initial="initial"
      whileHover="hover"
    >
      <motion.span
        className="inline-block"
        variants={{
          initial: { y: 0 },
          hover: { y: "-100%" },
        }}
        transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
      >
        {children}
      </motion.span>
      <motion.span
        className="absolute inset-0 inline-block text-twin-cyan"
        variants={{
          initial: { y: "100%" },
          hover: { y: 0 },
        }}
        transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
};
