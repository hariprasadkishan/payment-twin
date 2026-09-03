import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md font-sans text-xs font-medium tracking-tight transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:translate-y-[0.5px]";

    const variants = {
      primary:
        "border border-accent bg-accent font-semibold text-white shadow-sm hover:bg-accent-hover hover:border-accent-hover active:bg-accent-hover",
      secondary:
        "border border-hairline bg-surface text-textPrimary shadow-sm hover:bg-subtle hover:border-borderStrong active:bg-canvas",
      ghost:
        "bg-transparent text-textSecondary hover:bg-subtle hover:text-textPrimary active:bg-canvas",
      danger:
        "border border-red-200 bg-red-50 text-semantic-danger font-semibold hover:bg-red-100 hover:border-red-300 active:bg-red-200",
      outline:
        "border border-borderStrong bg-transparent text-accent hover:bg-accent-subtle hover:border-accent active:bg-accent-subtle",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-[11px] gap-1.5",
      md: "h-8 px-3.5 text-xs gap-2",
      lg: "h-9 px-4 text-sm gap-2.5",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span
            className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

