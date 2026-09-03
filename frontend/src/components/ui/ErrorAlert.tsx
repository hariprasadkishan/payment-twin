import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = "Analysis Unavailable",
  message,
  className,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "p-4 rounded-md border border-red-200 bg-red-50/80 text-textPrimary flex items-start gap-3 text-left shadow-panel",
        className
      )}
    >
      <AlertTriangle className="size-4 text-semantic-danger shrink-0 mt-0.5" strokeWidth={1.75} />
      <div className="space-y-1 flex-1">
        <h4 className="text-xs font-semibold text-semantic-danger tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-textSecondary leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold text-semantic-danger hover:underline pt-1 focus:outline-none focus-visible:ring-1"
          >
            Retry operation →
          </button>
        )}
      </div>
    </div>
  );
};

