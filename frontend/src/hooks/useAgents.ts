import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agentsApi } from "@/services/api/agentsApi";
import { AgentGenerationRequest } from "@/types/agent";

export const AGENT_KEYS = {
  all: ["agents"] as const,
  generated: () => [...AGENT_KEYS.all, "generated"] as const,
};

export function useGenerateAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AgentGenerationRequest = {}) => agentsApi.generatePopulation(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
}
