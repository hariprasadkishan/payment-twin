import React from "react";
import { Search, Sparkles, Terminal } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PageId } from "@/types/navigation";
import { cn } from "@/lib/utils";

const PAGE_META: Record<PageId, { title: string; section: string; description: string }> = {
  overview: {
    title: "Overview",
    section: "Intelligence",
    description: "Real-time payment performance, funnel conversion, and health signals",
  },
  dna: {
    title: "Behavioral DNA",
    section: "Intelligence",
    description: "Learned payment behavior profiles and statistical distributions",
  },
  agents: {
    title: "Customer Agents",
    section: "Intelligence",
    description: "Synthetic population calibrated to observed checkout behavior",
  },
  guardian: {
    title: "Payment Guardian",
    section: "Intelligence",
    description: "Statistical monitoring sentinel for drift and anomaly detection",
  },
  twin: {
    title: "Payment Twin",
    section: "Simulation",
    description: "Discrete-event payment simulation engine with counterfactual forecasting",
  },
  scenarios: {
    title: "What-If Studio",
    section: "Simulation",
    description: "Scenario planning and merchant intervention sensitivity analysis",
  },
  pareto: {
    title: "Pareto Optimizer",
    section: "Simulation",
    description: "Multi-objective frontier analysis for fee vs. conversion trade-offs",
  },
  settings: {
    title: "Settings",
    section: "System",
    description: "Merchant credentials, data sources, simulation seeds, and export options",
  },
};

import { CommandPalette } from "./CommandPalette";

export const TopNav: React.FC = () => {
  const { activePage, setActivePage, currentProvenance } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const meta = PAGE_META[activePage] ?? PAGE_META.overview;

  // Global keyboard shortcut: Cmd+K (macOS) / Ctrl+K (Windows/Linux)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const provenanceBadge = React.useMemo(() => {
    switch (currentProvenance) {
      case "OBSERVED_RAZORPAY_DATA":
        return { label: "Razorpay Test", tone: "bg-emerald-50/80 text-emerald-800 border-emerald-200" };
      case "SYNTHETIC_BENCHMARK_DATA":
        return { label: "Synthetic Benchmark", tone: "bg-blue-50/80 text-accent border-blue-200" };
      case "MIXED_DERIVED":
        return { label: "Derived Model", tone: "bg-indigo-50/80 text-indigo-800 border-indigo-200" };
      default:
        return { label: "Test Sandbox", tone: "bg-subtle text-textSecondary border-hairline" };
    }
  }, [currentProvenance]);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-surface/90 px-6 sm:px-8 lg:px-12 backdrop-blur-sm">
      {/* Breadcrumb and Page Title */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-textTertiary">
          <span className="hover:text-textSecondary transition-colors">Payment Twin</span>
          <span aria-hidden="true">/</span>
          <span>{meta.section}</span>
          <span aria-hidden="true">/</span>
          <span className="text-textSecondary font-semibold">{meta.title}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <h1 className="truncate text-base font-bold tracking-tight text-textPrimary">
            {meta.title}
          </h1>
          <span
            className={cn(
              "hidden sm:inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono font-medium tracking-tight",
              provenanceBadge.tone
            )}
          >
            <span className="size-1.5 rounded-full bg-current opacity-75" />
            {provenanceBadge.label}
          </span>
        </div>
      </div>

      {/* Right Control Strip */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Viewport Route Selector */}
        <select
          className="h-8 max-w-[130px] rounded-md border border-hairline bg-surface px-2 text-xs font-medium text-textPrimary md:hidden"
          value={activePage}
          onChange={(e) => setActivePage(e.target.value as PageId)}
          aria-label="Navigate workspace"
        >
          {Object.entries(PAGE_META).map(([id, page]) => (
            <option key={id} value={id}>
              {page.title}
            </option>
          ))}
        </select>

        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="hidden h-8 items-center gap-2 rounded-md border border-hairline bg-canvas/70 px-2.5 text-xs text-textTertiary transition-colors hover:bg-subtle hover:text-textPrimary hover:border-borderStrong active:bg-canvas lg:flex cursor-pointer select-none"
          aria-label="Quick search workspaces (⌘K)"
          title="Quick search workspaces and features (⌘K / Ctrl+K)"
        >
          <Search className="size-3.5 text-textTertiary" />
          <span>Quick search...</span>
          <kbd className="ml-3 rounded border border-hairline bg-surface px-1.5 py-0.2 font-mono text-[9px] text-textSecondary shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Viewport Search Icon Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="grid size-8 place-items-center rounded-md border border-hairline bg-surface text-textSecondary hover:bg-subtle hover:text-textPrimary transition-colors lg:hidden"
          aria-label="Quick search workspaces (⌘K)"
          title="Quick search workspaces and features (⌘K / Ctrl+K)"
        >
          <Search className="size-3.5" />
        </button>

        {/* Action: What-If Quick Launch Button */}
        <button
          onClick={() => setActivePage("scenarios")}
          className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 text-xs font-medium text-textSecondary hover:bg-subtle hover:text-textPrimary transition-colors"
          title="Open What-If Studio"
        >
          <Sparkles className="size-3.5 text-accent" />
          <span>Simulate</span>
        </button>

        {/* Docs / Help link */}
        <button
          onClick={() => setActivePage("settings")}
          className="grid size-8 place-items-center rounded-md text-textTertiary hover:bg-subtle hover:text-textPrimary transition-colors"
          aria-label="Settings & Configuration"
          title="Settings & System Configuration"
        >
          <Terminal className="size-4" />
        </button>

        <div className="h-4 w-px bg-hairline mx-0.5" aria-hidden="true" />

        {/* Merchant Workspace Avatar / Switcher */}
        <div className="flex items-center gap-2 pl-1">
          <div
            className="grid size-7 place-items-center rounded-md bg-blue-50 text-accent text-xs font-bold ring-1 ring-blue-200"
            title="Merchant: Test Merchant Account"
          >
            M
          </div>
          <div className="hidden xl:block text-left text-xs leading-none">
            <span className="block font-medium text-textPrimary">Merchant Sandbox</span>
            <span className="block text-[10px] font-mono text-textTertiary mt-0.5">INR • Razorpay</span>
          </div>
        </div>
      </div>

      {/* Global Command Search Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};
