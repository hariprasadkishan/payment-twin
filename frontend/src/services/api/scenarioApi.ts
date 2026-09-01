import { apiClient } from "./client";
import {
  ScenarioCompareRequest,
  ScenarioCompareResponse,
  ScenarioMatrixRequest,
  ScenarioMatrixResponse,
  ScenarioRunRequest,
} from "@/types/scenario";
import { SimulationResult } from "@/types/simulation";

export const scenarioApi = {
  /**
   * Executes a single counterfactual What-If scenario run.
   */
  runScenario: async (
    request: ScenarioRunRequest
  ): Promise<SimulationResult> => {
    return apiClient<SimulationResult>("/scenarios/run", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Executes baseline and counterfactual scenarios under Common Random Numbers (CRN)
   * and computes paired metric deltas and causal attribution.
   */
  compareScenarios: async (
    request: ScenarioCompareRequest
  ): Promise<ScenarioCompareResponse> => {
    return apiClient<ScenarioCompareResponse>("/scenarios/compare", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Executes a Cartesian product grid sweep over multiple intervention parameters.
   */
  runScenarioMatrix: async (
    request: ScenarioMatrixRequest
  ): Promise<ScenarioMatrixResponse> => {
    return apiClient<ScenarioMatrixResponse>("/scenarios/matrix", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};
