import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AppShell } from "@/components/layout/AppShell";
import { OverviewView } from "@/features/overview/OverviewView";
import { DNAView } from "@/features/dna/DNAView";
import { AgentsView } from "@/features/agents/AgentsView";
import { GuardianView } from "@/features/guardian/GuardianView";
import { TwinView } from "@/features/twin/TwinView";
import { ScenariosView } from "@/features/scenarios/ScenariosView";
import { ParetoView } from "@/features/pareto/ParetoView";
import { SettingsView } from "@/features/settings/SettingsView";
import { PageId } from "@/types/navigation";

export default function App() {
  const { activePage, setActivePage } = useAppStore();

  useEffect(() => {
    const checkUrl = () => {
      const hash = window.location.hash.replace("#", "") as PageId;
      const queryPage = new URLSearchParams(window.location.search).get("page") as PageId;
      const target = hash || queryPage;
      if (
        target &&
        [
          "overview",
          "dna",
          "agents",
          "guardian",
          "twin",
          "scenarios",
          "pareto",
          "settings",
        ].includes(target)
      ) {
        setActivePage(target);
      }
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, [setActivePage]);

  const renderActiveView = () => {
    switch (activePage) {
      case "overview":
        return <OverviewView />;
      case "dna":
        return <DNAView />;
      case "agents":
        return <AgentsView />;
      case "guardian":
        return <GuardianView />;
      case "twin":
        return <TwinView />;
      case "scenarios":
        return <ScenariosView />;
      case "pareto":
        return <ParetoView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return <AppShell>{renderActiveView()}</AppShell>;
}
