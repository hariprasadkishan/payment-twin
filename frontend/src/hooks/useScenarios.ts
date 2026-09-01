import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scenarioApi } from "@/services/api/scenarioApi";
import {
  ScenarioCompareRequest,
  ScenarioMatrixRequest,
  ScenarioRunRequest,
} from "@/types/scenario";

export const SCENARIO_KEYS = {
  all: ["scenarios"] as const,
  single: () => [...SCENARIO_KEYS.all, "single"] as const,
  compare: () => [...SCENARIO_KEYS.all, "compare"] as const,
  matrix: () => [...SCENARIO_KEYS.all, "matrix"] as const,
};

export function useRunScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScenarioRunRequest) => scenarioApi.runScenario(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIO_KEYS.all });
    },
  });
}

export function useCompareScenarios() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScenarioCompareRequest) => scenarioApi.compareScenarios(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIO_KEYS.all });
    },
  });
}

export function useScenarioMatrix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScenarioMatrixRequest) => scenarioApi.runScenarioMatrix(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCENARIO_KEYS.all });
    },
  });
}
