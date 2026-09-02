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
      "inline-flex items-center justify-center rounded-md font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#243b7a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f5] disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      primary:
        "border border-[#243b7a] bg-[#243b7a] font-semibold text-white hover:bg-[#1c3066]",
      secondary:
        "border border-[#d1d5ce] bg-white text-[#17211d] hover:bg-[#f7f7f5]",
      ghost:
        "bg-transparent text-[#5e6963] hover:bg-[#f0f1ee] hover:text-[#17211d]",
      danger:
        "border border-[#f0c9c6] bg-[#fbeceb] text-[#b23a36] hover:bg-[#f8dfdd]",
      outline:
        "border border-[#aeb9dc] bg-transparent text-[#243b7a] hover:bg-[#e8edfb]",
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
