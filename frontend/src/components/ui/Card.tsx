import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "metric" | "panel";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary:
        "glass-panel rounded-xl shadow-lg border border-twin-border",
      secondary:
        "bg-twin-card/40 border border-twin-border/70 rounded-xl",
      metric:
        "glass-panel glass-panel-hover p-4 rounded-xl border border-twin-border flex flex-col justify-between",
      panel:
        "bg-[#0A0E18] border border-twin-border/80 rounded-xl p-5",
    };

    return <div ref={ref} className={cn(variants[variant], className)} {...props} />;
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-display font-semibold text-twin-white tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-twin-slate leading-relaxed", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 pt-0 border-t border-twin-border/40 mt-4", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
