import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataApi } from "@/services/api/dataApi";
import { PaymentIngestionRequest } from "@/types/dataset";

export const DATASET_KEYS = {
  all: ["datasets"] as const,
  list: () => [...DATASET_KEYS.all, "list"] as const,
  summary: (filename?: string) => [...DATASET_KEYS.all, "summary", filename || "all"] as const,
  connection: () => [...DATASET_KEYS.all, "connection"] as const,
};

export function useDatasetList() {
  return useQuery({
    queryKey: DATASET_KEYS.list(),
    queryFn: () => dataApi.listDatasets(),
    staleTime: 1000 * 30, // 30s
  });
}

export function useDatasetSummary(filename?: string) {
  return useQuery({
    queryKey: DATASET_KEYS.summary(filename),
    queryFn: () => dataApi.getDatasetSummary(filename),
    staleTime: 1000 * 30,
  });
}

export function useRazorpayConnection() {
  return useQuery({
    queryKey: DATASET_KEYS.connection(),
    queryFn: () => dataApi.testRazorpayConnection(),
    staleTime: 1000 * 60, // 60s
  });
}

export function useIngestPayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PaymentIngestionRequest = {}) => dataApi.ingestPayments(request),
    onSuccess: () => {
      // Invalidate datasets, DNA, and Guardian caches upon new ingestion
      queryClient.invalidateQueries({ queryKey: DATASET_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dna"] });
      queryClient.invalidateQueries({ queryKey: ["guardian"] });
    },
  });
}

export function useLoadBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataApi.loadBenchmarkDataset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATASET_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dna"] });
      queryClient.invalidateQueries({ queryKey: ["guardian"] });
      queryClient.invalidateQueries({ queryKey: ["simulation"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useClearBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataApi.clearBenchmarkDataset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATASET_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dna"] });
      queryClient.invalidateQueries({ queryKey: ["guardian"] });
      queryClient.invalidateQueries({ queryKey: ["simulation"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

