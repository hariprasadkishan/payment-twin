import { apiClient } from "./client";
import {
  MonteCarloRequest,
  MonteCarloSimulationResult,
  SimulationConfig,
  SimulationResult,
} from "@/types/simulation";

export const simulationApi = {
  /**
   * Executes a single baseline Payment Twin discrete-event simulation run.
   */
  runSimulation: async (
    config: SimulationConfig = {}
  ): Promise<SimulationResult> => {
    return apiClient<SimulationResult>("/simulation/run", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  /**
   * Executes a multi-run Monte Carlo sweep for uncertainty and risk analysis.
   */
  runMonteCarlo: async (
    request: MonteCarloRequest = {}
  ): Promise<MonteCarloSimulationResult> => {
    return apiClient<MonteCarloSimulationResult>("/simulation/monte-carlo", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};
