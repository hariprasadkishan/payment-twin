import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "cyan" | "indigo";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}) => {
  const variants = {
    success: "bg-twin-success/10 text-twin-success border-twin-success/20",
    warning: "bg-twin-warning/10 text-twin-warning border-twin-warning/20",
    danger: "bg-twin-danger/10 text-twin-danger border-twin-danger/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutral: "bg-twin-slate/10 text-twin-slate border-twin-border",
    cyan: "bg-twin-cyan/10 text-twin-cyan border-twin-cyan/30",
    indigo: "bg-twin-indigo/10 text-twin-indigo border-twin-indigo/30",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 font-mono",
    md: "text-xs px-2.5 py-1 font-mono",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
