import React from "react";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Gauge,
  GitBranch,
  ShieldAlert,
  SlidersHorizontal,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PageId } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { useGuardianStatus } from "@/hooks/useGuardian";

type NavItem = {
  id: PageId;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    items: [{ id: "overview", label: "Overview", icon: BarChart3 }],
  },
  {
    label: "Intelligence",
    items: [
      { id: "dna", label: "Behavioral DNA", icon: Gauge },
      { id: "agents", label: "Customer Agents", icon: Bot },
      { id: "guardian", label: "Payment Guardian", icon: ShieldAlert },
    ],
  },
  {
    label: "Simulation",
    items: [
      { id: "twin", label: "Payment Twin", icon: Sparkles },
      { id: "scenarios", label: "What-If Studio", icon: SlidersHorizontal },
      { id: "pareto", label: "Pareto Optimizer", icon: GitBranch },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", label: "Settings", icon: Settings2 }],
  },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, isSidebarCollapsed, toggleSidebar, systemHealth } =
    useAppStore();
  const { data: guardianStatus } = useGuardianStatus();
  const alerts = guardianStatus?.active_alerts_count ?? 0;

  return (
    <aside
      className={cn(
        "hidden h-screen sticky top-0 shrink-0 flex-col border-r border-hairline bg-surface md:flex z-30 select-none transition-all duration-200",
        isSidebarCollapsed ? "w-[64px]" : "w-[240px]"
      )}
      aria-label="Application navigation"
    >
      {/* Brand & Organization Header */}
      <div className="flex h-16 items-center border-b border-hairline px-4 justify-between">
        <button
          onClick={() => setActivePage("overview")}
          className={cn(
            "flex min-w-0 items-center gap-3 text-left focus-visible:ring-1 rounded-md p-1",
            isSidebarCollapsed && "mx-auto justify-center"
          )}
          aria-label="Payment Twin Overview"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-xs font-bold text-xs tracking-tight">
            PT
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold tracking-tight text-textPrimary leading-none">
                  Payment Twin
                </span>
              </div>
              <span className="block truncate text-[10px] font-mono text-textTertiary mt-1 uppercase tracking-wider leading-none">
                Merchant Intelligence
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Nav Link Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {groups.map((group, index) => (
          <section key={group.label ?? `group-${index}`}>
            {group.label && !isSidebarCollapsed && (
              <h2 className="mb-1.5 px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-textTertiary">
                {group.label}
              </h2>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = activePage === id;
                const hasAlert = id === "guardian" && alerts > 0;

                return (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    title={isSidebarCollapsed ? label : undefined}
                    className={cn(
                      "group relative flex h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium transition-colors",
                      active
                        ? "bg-blue-50/80 text-accent font-semibold"
                        : "text-textSecondary hover:bg-subtle/70 hover:text-textPrimary",
                      isSidebarCollapsed && "justify-center px-0 h-9"
                    )}
                  >
                    {active && !isSidebarCollapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-accent" />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-accent" : "text-textTertiary group-hover:text-textPrimary"
                      )}
                      strokeWidth={active ? 2 : 1.75}
                    />

                    {!isSidebarCollapsed && (
                      <>
                        <span className="truncate flex-1">{label}</span>
                        {hasAlert && (
                          <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-semantic-danger text-[10px] font-semibold text-white">
                            {alerts}
                          </span>
                        )}
                      </>
                    )}

                    {/* Indicator pip when collapsed and alert is active */}
                    {isSidebarCollapsed && hasAlert && (
                      <span className="absolute top-1 right-1 size-2 rounded-full bg-semantic-danger ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      {/* System Status & Collapse Toggle Footer */}
      <div className="border-t border-hairline p-2.5 space-y-2">
        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-textTertiary font-mono">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  systemHealth === "healthy"
                    ? "bg-semantic-success"
                    : systemHealth === "degraded"
                    ? "bg-semantic-warning"
                    : "bg-textTertiary"
                )}
              />
              <span className="capitalize">{systemHealth} engine</span>
            </span>
            <span className="tabular-nums font-mono text-[10px]">v1.0</span>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-md px-2 text-xs font-medium text-textSecondary hover:bg-subtle hover:text-textPrimary transition-colors"
          aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          title={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span className="flex-1 text-left text-[11px]">Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
