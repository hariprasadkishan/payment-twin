import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-twin-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-twin-bg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-twin-cyan text-twin-bg font-semibold hover:bg-twin-cyan/90 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]",
      secondary:
        "bg-twin-card border border-twin-border text-twin-white hover:bg-twin-card/80 hover:border-twin-slate/40",
      ghost:
        "bg-transparent text-twin-slate hover:text-twin-white hover:bg-twin-card/50",
      danger:
        "bg-twin-danger/10 border border-twin-danger/30 text-twin-danger hover:bg-twin-danger/20",
      outline:
        "bg-transparent border border-twin-border text-twin-white hover:border-twin-cyan/50 hover:text-twin-cyan",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
