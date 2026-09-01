import { useMutation, useQueryClient } from "@tanstack/react-query";
import { optimizationApi } from "@/services/api/optimizationApi";
import { OptimizationRequest } from "@/types/optimization";

export const OPTIMIZATION_KEYS = {
  all: ["optimization"] as const,
  pareto: () => [...OPTIMIZATION_KEYS.all, "pareto"] as const,
};

export function useParetoOptimization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: OptimizationRequest) => optimizationApi.runParetoOptimization(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPTIMIZATION_KEYS.all });
    },
  });
}
