import { apiClient } from "./client";
import {
  AlertStatus,
  GuardianAlert,
  GuardianAnalysisResult,
  GuardianConfig,
  GuardianStatusResponse,
} from "@/types/guardian";

export const guardianApi = {
  /**
   * Retrieves Payment Guardian sentinel health, DNA baseline readiness, and active alert counts.
   */
  getGuardianStatus: async (): Promise<GuardianStatusResponse> => {
    return apiClient<GuardianStatusResponse>("/guardian/status");
  },

  /**
   * Executes statistical drift detector battery across recent payment records.
   */
  analyzeTelemetry: async (
    config?: GuardianConfig
  ): Promise<GuardianAnalysisResult> => {
    return apiClient<GuardianAnalysisResult>("/guardian/analyze", {
      method: "POST",
      body: config ? JSON.stringify(config) : undefined,
    });
  },

  /**
   * Lists all historical and active alerts with optional status filtering.
   */
  listAlerts: async (statusFilter?: AlertStatus): Promise<GuardianAlert[]> => {
    const query = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
    return apiClient<GuardianAlert[]>(`/guardian/alerts${query}`);
  },

  /**
   * Transitions an open alert to ACKNOWLEDGED.
   */
  acknowledgeAlert: async (alertId: string): Promise<GuardianAlert> => {
    return apiClient<GuardianAlert>(`/guardian/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
      method: "POST",
    });
  },

  /**
   * Transitions an alert to RESOLVED.
   */
  resolveAlert: async (alertId: string): Promise<GuardianAlert> => {
    return apiClient<GuardianAlert>(`/guardian/alerts/${encodeURIComponent(alertId)}/resolve`, {
      method: "POST",
    });
  },
};
