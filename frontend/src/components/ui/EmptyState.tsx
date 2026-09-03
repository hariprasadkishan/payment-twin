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
        "p-8 rounded-lg border border-hairline bg-surface text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto shadow-panel",
        className
      )}
    >
      <div className="p-3 rounded-full bg-subtle border border-hairline text-accent">
        <Icon className="size-5 text-accent" strokeWidth={1.75} />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border border-hairline bg-canvas text-textSecondary mb-1">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>{statusBadge}</span>
        </div>
        <h3 className="text-sm font-semibold text-textPrimary tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-textSecondary leading-relaxed max-w-sm">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
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

