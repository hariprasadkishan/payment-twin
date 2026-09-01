import { apiClient } from "./client";
import { AgentGenerationRequest, AgentGenerationResponse } from "@/types/agent";

export const agentsApi = {
  /**
   * Generates a calibrated population of synthetic Customer Agents from Behavioral DNA.
   */
  generatePopulation: async (
    request: AgentGenerationRequest = {}
  ): Promise<AgentGenerationResponse> => {
    return apiClient<AgentGenerationResponse>("/agents/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};
