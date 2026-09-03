import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "cyan" | "indigo";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    neutral: "bg-subtle text-textSecondary border-hairline",
    cyan: "bg-blue-50 text-accent border-blue-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  };

  const dotTones = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-red-600",
    info: "bg-blue-600",
    neutral: "bg-textTertiary",
    cyan: "bg-accent",
    indigo: "bg-indigo-600",
  };

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-[11px] px-2 py-0.5 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-sans font-medium tracking-tight whitespace-nowrap leading-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", dotTones[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

