import { useMutation, useQueryClient } from "@tanstack/react-query";
import { simulationApi } from "@/services/api/simulationApi";
import { MonteCarloRequest, SimulationConfig } from "@/types/simulation";

export const SIMULATION_KEYS = {
  all: ["simulation"] as const,
  single: () => [...SIMULATION_KEYS.all, "single"] as const,
  monteCarlo: () => [...SIMULATION_KEYS.all, "monteCarlo"] as const,
};

export function useRunSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: SimulationConfig = {}) => simulationApi.runSimulation(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATION_KEYS.all });
    },
  });
}

export function useRunMonteCarlo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MonteCarloRequest = {}) => simulationApi.runMonteCarlo(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATION_KEYS.all });
    },
  });
}
