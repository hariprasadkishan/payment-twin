import React from "react";
import { Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  statusBadge?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Info,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  statusBadge = "Awaiting Data",
}) => {
  return (
    <div
      className={cn(
        "p-8 rounded-xl glass-panel border border-twin-border text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto",
        className
      )}
    >
      <div className="p-3 rounded-full bg-twin-card border border-twin-border text-twin-cyan">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border border-twin-border bg-twin-bg text-twin-slate mb-1">
          STATUS: {statusBadge}
        </div>
        <h3 className="text-base font-display font-semibold text-twin-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-twin-slate leading-relaxed max-w-sm">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
