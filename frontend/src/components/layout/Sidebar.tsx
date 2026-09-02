import React from "react";
import { BarChart3, Bot, ChevronLeft, ChevronRight, Gauge, GitBranch, ShieldAlert, SlidersHorizontal, Settings2, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PageId } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { useGuardianStatus } from "@/hooks/useGuardian";

type NavItem = { id: PageId; label: string; icon: React.ElementType };
const groups: { label?: string; items: NavItem[] }[] = [
  { items: [{ id: "overview", label: "Overview", icon: BarChart3 }] },
  { label: "Intelligence", items: [{ id: "dna", label: "Behavioral DNA", icon: Gauge }, { id: "agents", label: "Customer Agents", icon: Bot }, { id: "guardian", label: "Payment Guardian", icon: ShieldAlert }] },
  { label: "Simulation", items: [{ id: "twin", label: "Payment Twin", icon: Sparkles }, { id: "scenarios", label: "What-If Studio", icon: SlidersHorizontal }, { id: "pareto", label: "Pareto Optimizer", icon: GitBranch }] },
  { label: "System", items: [{ id: "settings", label: "Settings", icon: Settings2 }] },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, isSidebarCollapsed, toggleSidebar } = useAppStore();
  const { data: guardianStatus } = useGuardianStatus();
  const alerts = guardianStatus?.active_alerts_count ?? 0;
  return <aside className={cn("hidden h-screen shrink-0 flex-col border-r border-[#e2e4df] bg-white md:flex", isSidebarCollapsed ? "w-[68px]" : "w-[232px]")} aria-label="Application navigation">
    <div className="flex h-16 items-center border-b border-[#e2e4df] px-4"><button onClick={() => setActivePage("overview")} className={cn("flex min-w-0 items-center gap-2.5 text-left", isSidebarCollapsed && "mx-auto")} aria-label="Payment Twin overview"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#243b7a] text-xs font-semibold text-white">PT</span>{!isSidebarCollapsed && <span className="min-w-0"><span className="block truncate text-sm font-semibold tracking-[-0.02em] text-[#17211d]">Payment Twin</span><span className="block truncate text-[11px] text-[#87908a]">Merchant intelligence</span></span>}</button></div>
    <nav className="flex-1 overflow-y-auto px-3 py-5">{groups.map((group, index) => <section key={group.label ?? "overview"} className={cn(index > 0 && "mt-6")}>{group.label && !isSidebarCollapsed && <h2 className="mb-1.5 px-2 text-[11px] font-medium text-[#87908a]">{group.label}</h2>}<div className="space-y-0.5">{group.items.map(({ id, label, icon: Icon }) => { const active = activePage === id; const hasAlert = id === "guardian" && alerts > 0; return <button key={id} onClick={() => setActivePage(id)} title={isSidebarCollapsed ? label : undefined} className={cn("group flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] transition-colors", active ? "bg-[#e8edfb] font-medium text-[#243b7a]" : "text-[#46514b] hover:bg-[#f0f1ee] hover:text-[#17211d]", isSidebarCollapsed && "justify-center px-0")}><Icon className="size-4 shrink-0" strokeWidth={active ? 2 : 1.8} />{!isSidebarCollapsed && <><span className="truncate">{label}</span>{hasAlert && <span className="ml-auto grid size-4 place-items-center rounded-full bg-[#b23a36] text-[10px] text-white">{alerts}</span>}</>}</button>; })}</div></section>)}</nav>
    <div className="border-t border-[#e2e4df] p-3"><button onClick={toggleSidebar} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs text-[#5e6963] hover:bg-[#f0f1ee] hover:text-[#17211d]" aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>{isSidebarCollapsed ? <ChevronRight className="mx-auto size-4" /> : <><ChevronLeft className="size-4" /> Collapse sidebar</>}</button></div>
  </aside>;
};
