import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guardianApi } from "@/services/api/guardianApi";
import { AlertStatus, GuardianConfig } from "@/types/guardian";

export const GUARDIAN_KEYS = {
  all: ["guardian"] as const,
  status: () => [...GUARDIAN_KEYS.all, "status"] as const,
  alerts: (statusFilter?: AlertStatus) => [...GUARDIAN_KEYS.all, "alerts", statusFilter || "all"] as const,
};

export function useGuardianStatus() {
  return useQuery({
    queryKey: GUARDIAN_KEYS.status(),
    queryFn: () => guardianApi.getGuardianStatus(),
    staleTime: 1000 * 30, // 30s modest interval
  });
}

export function useGuardianAlerts(statusFilter?: AlertStatus) {
  return useQuery({
    queryKey: GUARDIAN_KEYS.alerts(statusFilter),
    queryFn: () => guardianApi.listAlerts(statusFilter),
    staleTime: 1000 * 30,
  });
}

export function useAnalyzeGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config?: GuardianConfig) => guardianApi.analyzeTelemetry(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUARDIAN_KEYS.all });
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => guardianApi.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUARDIAN_KEYS.all });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => guardianApi.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUARDIAN_KEYS.all });
    },
  });
}
