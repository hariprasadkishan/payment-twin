import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              className={cn(
                "w-screen max-w-md bg-surface border-l border-hairline shadow-drawer flex flex-col justify-between",
                className
              )}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="p-5 border-b border-hairline flex items-start justify-between bg-surface">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-textPrimary tracking-tight">
                    {title}
                  </h2>
                  {description && <p className="text-xs text-textSecondary">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md text-textTertiary hover:text-textPrimary hover:bg-subtle transition-colors"
                  aria-label="Close panel"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-textPrimary">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

