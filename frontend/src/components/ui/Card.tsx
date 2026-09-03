import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "metric" | "panel";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "rounded-lg border border-hairline bg-surface shadow-panel",
      secondary: "rounded-lg border border-hairline bg-canvas",
      metric: "flex flex-col justify-between rounded-lg border border-hairline bg-surface p-4 shadow-panel",
      panel: "rounded-lg border border-hairline bg-surface p-5 shadow-panel",
    };

    return <div ref={ref} className={cn(variants[variant], className)} {...props} />;
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1 p-5 pb-3", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-sm font-semibold tracking-tight text-textPrimary leading-none", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs leading-relaxed text-textSecondary", className)} {...props} />
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
    <div
      ref={ref}
      className={cn("flex items-center p-5 pt-3 border-t border-hairline mt-3 text-xs text-textSecondary", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

