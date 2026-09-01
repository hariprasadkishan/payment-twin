import { apiClient } from "./client";
import { BehavioralDNAProfile, DNAStatusResponse } from "@/types/dna";

export const dnaApi = {
  /**
   * Retrieves Behavioral DNA readiness, sample size, and confidence grading.
   */
  getDNAStatus: async (): Promise<DNAStatusResponse> => {
    return apiClient<DNAStatusResponse>("/dna/status");
  },

  /**
   * Generates or retrieves the complete empirical Behavioral DNA Profile.
   */
  getDNAProfile: async (dataset?: string): Promise<BehavioralDNAProfile> => {
    const query = dataset ? `?dataset=${encodeURIComponent(dataset)}` : "";
    return apiClient<BehavioralDNAProfile>(`/dna/profile${query}`);
  },
};
