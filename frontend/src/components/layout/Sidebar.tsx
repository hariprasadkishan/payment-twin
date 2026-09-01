import React from "react";
import { 
  LayoutDashboard, 
  Dna, 
  Bot, 
  ShieldAlert, 
  PlayCircle, 
  SlidersHorizontal, 
  TrendingUp, 
  Settings, 
  PanelLeftClose, 
  PanelLeft,
  Cpu
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PageId, NavSection } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useGuardianStatus } from "@/hooks/useGuardian";

const ICONS: Record<PageId, React.ElementType> = {
  overview: LayoutDashboard,
  dna: Dna,
  agents: Bot,
  guardian: ShieldAlert,
  twin: PlayCircle,
  scenarios: SlidersHorizontal,
  pareto: TrendingUp,
  settings: Settings,
};

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, isSidebarCollapsed, toggleSidebar } = useAppStore();
  const { data: guardianStatus } = useGuardianStatus();
  const activeAlertsCount = guardianStatus?.active_alerts_count ?? 0;

  const navSections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { id: "overview", label: "Command Center" },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        { id: "dna", label: "Behavioral DNA" },
        { id: "agents", label: "Customer Agents" },
        { 
          id: "guardian", 
          label: "Payment Guardian", 
          badge: activeAlertsCount > 0 ? activeAlertsCount : undefined, 
          badgeVariant: activeAlertsCount > 0 ? "danger" : "neutral" 
        },
      ],
    },
    {
      title: "SIMULATION",
      items: [
        { id: "twin", label: "Payment Twin" },
        { id: "scenarios", label: "What-If Studio" },
        { id: "pareto", label: "Pareto Explorer" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { id: "settings", label: "Data & Settings" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col justify-between border-r border-twin-border bg-[#090D16] transition-all duration-200 z-30",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Brand Mark */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-twin-border/60">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-twin-cyan/15 border border-twin-cyan/30 text-twin-cyan">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm tracking-tight text-twin-white">
                  PAYMENT <span className="text-twin-cyan">TWIN</span>
                </span>
                <span className="text-[9px] font-mono text-twin-slate tracking-wider uppercase">
                  Intelligence Cockpit
                </span>
              </div>
            </div>
          )}

          {isSidebarCollapsed && (
            <div className="p-2 rounded-lg bg-twin-cyan/15 border border-twin-cyan/30 text-twin-cyan mx-auto">
              <Cpu className="w-4 h-4" />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-twin-slate hover:text-twin-white hover:bg-twin-card/50 transition-colors hidden md:flex"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Sections */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isSidebarCollapsed && (
                <span className="px-2 text-[10px] font-mono font-semibold text-twin-slate/70 tracking-wider uppercase">
                  {section.title}
                </span>
              )}

              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = ICONS[item.id] || LayoutDashboard;
                  const isActive = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 group",
                        isActive
                          ? "bg-twin-cyan/15 text-twin-cyan font-semibold border border-twin-cyan/30 shadow-sm"
                          : "text-twin-slate hover:text-twin-white hover:bg-twin-card/60"
                      )}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive ? "text-twin-cyan" : "text-twin-slate group-hover:text-twin-white"
                          )}
                        />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <Badge variant={item.badgeVariant || "neutral"} size="sm">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-twin-border/60">
        {!isSidebarCollapsed ? (
          <div className="p-2.5 rounded-lg bg-twin-card/40 border border-twin-border/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-twin-slate">ENVIRONMENT</span>
            <span className="text-twin-cyan font-semibold">TEST MODE</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-twin-cyan mx-auto animate-pulse" title="TEST MODE" />
        )}
      </div>
    </aside>
  );
};
