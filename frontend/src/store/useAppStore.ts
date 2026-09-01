import { create } from "zustand";
import { PageId } from "@/types/navigation";
import { ProvenanceType, SystemHealthStatus } from "@/types/provenance";
import { GuardianTwinHandoff } from "@/types/guardian";

interface AppState {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;

  activeTwinHandoff: GuardianTwinHandoff | null;
  setActiveTwinHandoff: (handoff: GuardianTwinHandoff | null) => void;

  currentProvenance: ProvenanceType;
  setCurrentProvenance: (prov: ProvenanceType) => void;

  systemHealth: SystemHealthStatus;
  setSystemHealth: (status: SystemHealthStatus) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: "overview",
  setActivePage: (page) => set({ activePage: page }),

  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  selectedAlertId: null,
  setSelectedAlertId: (id) => set({ selectedAlertId: id, isDrawerOpen: !!id }),
  isDrawerOpen: false,
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),

  activeTwinHandoff: null,
  setActiveTwinHandoff: (handoff) => set({ activeTwinHandoff: handoff }),

  currentProvenance: "UNAVAILABLE",
  setCurrentProvenance: (prov) => set({ currentProvenance: prov }),

  systemHealth: "unavailable",
  setSystemHealth: (status) => set({ systemHealth: status }),
}));

