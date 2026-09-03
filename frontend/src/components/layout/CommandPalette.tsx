import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BarChart3,
  Gauge,
  Bot,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  GitBranch,
  Settings2,
  CornerDownLeft,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PageId } from "@/types/navigation";
import { cn } from "@/lib/utils";

interface NavigationDestination {
  id: PageId;
  title: string;
  section: "Overview" | "Intelligence" | "Simulation" | "System";
  description: string;
  keywords: string[];
  icon: React.ElementType;
}

const DESTINATIONS: NavigationDestination[] = [
  {
    id: "overview",
    title: "Overview",
    section: "Overview",
    description: "Real-time payment performance, funnel conversion, and health signals",
    keywords: ["overview", "dashboard", "metrics", "kpi", "conversion", "revenue", "command center", "home"],
    icon: BarChart3,
  },
  {
    id: "dna",
    title: "Behavioral DNA",
    section: "Intelligence",
    description: "Learned payment behavior profiles and statistical distributions",
    keywords: ["dna", "behavior", "distribution", "methods", "profile", "rates", "upi", "card", "economics"],
    icon: Gauge,
  },
  {
    id: "agents",
    title: "Customer Agents",
    section: "Intelligence",
    description: "Synthetic population calibrated to observed checkout behavior",
    keywords: ["agents", "synthetic", "population", "archetypes", "customers", "patience", "retries", "trace"],
    icon: Bot,
  },
  {
    id: "guardian",
    title: "Payment Guardian",
    section: "Intelligence",
    description: "Statistical monitoring sentinel for drift and anomaly detection",
    keywords: ["guardian", "monitoring", "drift", "anomaly", "alerts", "sentinel", "detectors", "attention"],
    icon: ShieldAlert,
  },
  {
    id: "twin",
    title: "Payment Twin",
    section: "Simulation",
    description: "Discrete-event payment simulation engine with counterfactual forecasting",
    keywords: ["twin", "simulation", "funnel", "discrete event", "monte carlo", "checkout", "dropoff", "bottleneck"],
    icon: Sparkles,
  },
  {
    id: "scenarios",
    title: "What-If Studio",
    section: "Simulation",
    description: "Scenario planning and merchant intervention sensitivity analysis",
    keywords: ["what if", "scenarios", "counterfactual", "intervention", "attribution", "levers", "crn", "paired"],
    icon: SlidersHorizontal,
  },
  {
    id: "pareto",
    title: "Pareto Optimizer",
    section: "Simulation",
    description: "Multi-objective frontier analysis for fee vs. conversion trade-offs",
    keywords: ["pareto", "optimizer", "frontier", "tradeoffs", "candidates", "multi objective", "policy", "search"],
    icon: GitBranch,
  },
  {
    id: "settings",
    title: "Settings",
    section: "System",
    description: "Merchant credentials, data sources, simulation seeds, and export options",
    keywords: ["settings", "api", "razorpay", "keys", "credentials", "benchmark", "datasets", "config"],
    icon: Settings2,
  },
];

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { setActivePage } = useAppStore();
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input and reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter destinations based on query
  const filteredDestinations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DESTINATIONS;

    return DESTINATIONS.filter((dest) => {
      const matchTitle = dest.title.toLowerCase().includes(q);
      const matchSection = dest.section.toLowerCase().includes(q);
      const matchDesc = dest.description.toLowerCase().includes(q);
      const matchKeywords = dest.keywords.some((k) => k.includes(q));
      return matchTitle || matchSection || matchDesc || matchKeywords;
    });
  }, [query]);

  // Keep highlighted index within bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredDestinations.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Navigate to destination
  const handleSelect = (dest: NavigationDestination) => {
    setActivePage(dest.id);
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredDestinations.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredDestinations.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredDestinations.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredDestinations.length) % filteredDestinations.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredDestinations[highlightedIndex]) {
        handleSelect(filteredDestinations[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command search palette"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-hairline bg-surface shadow-2xl z-10"
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-hairline bg-surface">
              <Search className="size-4 text-textTertiary shrink-0" strokeWidth={1.75} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search navigation, workspaces, or features..."
                className="w-full bg-transparent text-xs text-textPrimary placeholder:text-textTertiary focus:outline-none"
                aria-label="Search navigation destinations"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-textTertiary hover:text-textPrimary p-0.5 rounded"
                  aria-label="Clear search input"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center rounded border border-hairline bg-canvas px-1.5 py-0.5 font-mono text-[9px] text-textSecondary uppercase select-none">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
              {filteredDestinations.length > 0 ? (
                filteredDestinations.map((dest, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const Icon = dest.icon;

                  return (
                    <button
                      key={dest.id}
                      type="button"
                      data-index={idx}
                      onClick={() => handleSelect(dest)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-left transition-colors cursor-pointer select-none",
                        isHighlighted
                          ? "bg-accent-subtle text-accent"
                          : "text-textPrimary hover:bg-subtle"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "p-1.5 rounded-md border shrink-0",
                            isHighlighted
                              ? "bg-surface border-blue-200 text-accent"
                              : "bg-canvas border-hairline text-textSecondary"
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-tight">
                              {dest.title}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-textTertiary border border-hairline/60 px-1 py-0.2 rounded bg-canvas">
                              {dest.section}
                            </span>
                          </div>
                          <p className="text-[11px] text-textSecondary truncate max-w-sm mt-0.5">
                            {dest.description}
                          </p>
                        </div>
                      </div>

                      {isHighlighted && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-accent shrink-0 font-medium">
                          <span>Go</span>
                          <CornerDownLeft className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-textPrimary">
                    No matching destinations found
                  </p>
                  <p className="text-[11px] text-textSecondary max-w-xs mx-auto">
                    Try searching for Overview, Behavioral DNA, Guardian, Twin, What-If, Pareto, or Settings.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Control Hint */}
            <div className="flex items-center justify-between px-3.5 py-2 border-t border-hairline bg-canvas/60 text-[10px] font-mono text-textTertiary">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-hairline bg-surface px-1 py-0.2">↑</kbd>
                  <kbd className="rounded border border-hairline bg-surface px-1 py-0.2">↓</kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-hairline bg-surface px-1 py-0.2">↵</kbd>
                  <span>select</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-hairline bg-surface px-1 py-0.2">esc</kbd>
                <span>close</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
