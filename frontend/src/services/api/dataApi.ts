import { apiClient } from "./client";
import {
  DatasetListResponse,
  DatasetSummaryResponse,
  PaymentIngestionRequest,
  PaymentIngestionResponse,
  RazorpayConnectionTestResponse,
} from "@/types/dataset";

export const dataApi = {
  /**
   * Verifies Razorpay API Test Mode credentials and connection status.
   */
  testRazorpayConnection: async (): Promise<RazorpayConnectionTestResponse> => {
    return apiClient<RazorpayConnectionTestResponse>("/data/razorpay/test-connection");
  },

  /**
   * Triggers ingestion of test payment records from Razorpay Test Mode.
   */
  ingestPayments: async (
    request: PaymentIngestionRequest = {}
  ): Promise<PaymentIngestionResponse> => {
    return apiClient<PaymentIngestionResponse>("/data/payments/ingest", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Lists all available raw JSONL payment datasets.
   */
  listDatasets: async (): Promise<DatasetListResponse> => {
    return apiClient<DatasetListResponse>("/data/datasets");
  },

  /**
   * Generates aggregate statistical summary for datasets.
   */
  getDatasetSummary: async (filename?: string): Promise<DatasetSummaryResponse> => {
    const query = filename ? `?filename=${encodeURIComponent(filename)}` : "";
    return apiClient<DatasetSummaryResponse>(`/data/datasets/summary${query}`);
  },
};
