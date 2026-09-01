import { apiClient } from "./client";
import { OptimizationRequest, ParetoFrontierResult } from "@/types/optimization";

export const optimizationApi = {
  /**
   * Executes multi-objective Pareto optimization across candidate scenario configurations.
   */
  runParetoOptimization: async (
    request: OptimizationRequest
  ): Promise<ParetoFrontierResult> => {
    return apiClient<ParetoFrontierResult>("/optimization/pareto", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};
