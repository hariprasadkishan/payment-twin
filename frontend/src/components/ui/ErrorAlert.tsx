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
      className={cn(
        "p-4 rounded-xl border border-twin-danger/30 bg-twin-danger/10 text-twin-white flex items-start gap-3 text-left",
        className
      )}
    >
      <AlertTriangle className="w-5 h-5 text-twin-danger shrink-0 mt-0.5" />
      <div className="space-y-1 flex-1">
        <h4 className="text-xs font-semibold text-twin-danger font-mono tracking-wide uppercase">
          {title}
        </h4>
        <p className="text-xs text-twin-slate leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-twin-danger underline hover:text-twin-danger/80 pt-1"
          >
            Retry request
          </button>
        )}
      </div>
    </div>
  );
};
