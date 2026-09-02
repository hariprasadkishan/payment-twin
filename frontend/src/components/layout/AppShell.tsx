import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ProvenanceBanner } from "./ProvenanceBanner";
import { useAppStore } from "@/store/useAppStore";
import { useDNAStatus } from "@/hooks/useDNA";
export interface AppShellProps { children: React.ReactNode }
export const AppShell: React.FC<AppShellProps> = ({ children }) => { const { currentProvenance, setCurrentProvenance, setSystemHealth } = useAppStore(); const { data: dnaStatus } = useDNAStatus(); React.useEffect(() => { if (dnaStatus?.profiling_available) { setCurrentProvenance(dnaStatus.provenance_type as any); setSystemHealth("healthy"); } else if (dnaStatus?.provenance_type === "NO_DATA_AVAILABLE") { setCurrentProvenance("UNAVAILABLE"); setSystemHealth("unavailable"); } }, [dnaStatus, setCurrentProvenance, setSystemHealth]); const provenance = dnaStatus?.profiling_available ? dnaStatus.provenance_type as any : currentProvenance; return <div className="flex min-h-screen bg-[#f7f7f5] text-[#17211d]"><Sidebar /><div className="min-w-0 flex-1"><TopNav /><main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-7 sm:py-7"><ProvenanceBanner provenance={provenance} sampleSize={dnaStatus?.available_sample_count ?? 0} />{children}</main></div></div>; };
