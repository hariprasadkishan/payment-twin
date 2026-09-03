import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className, children }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center p-0.5 rounded-md bg-subtle border border-hairline text-textSecondary select-none",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, className, children }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        isActive
          ? "bg-surface text-textPrimary shadow-sm font-semibold"
          : "text-textSecondary hover:text-textPrimary hover:bg-surface/50",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, className, children }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");

  if (ctx.value !== value) return null;

  return (
    <div role="tabpanel" tabIndex={0} className={cn("focus-visible:outline-none", className)}>
      {children}
    </div>
  );
};

