import { useQuery } from "@tanstack/react-query";
import { dnaApi } from "@/services/api/dnaApi";

export const DNA_KEYS = {
  all: ["dna"] as const,
  status: () => [...DNA_KEYS.all, "status"] as const,
  profile: (dataset?: string) => [...DNA_KEYS.all, "profile", dataset || "default"] as const,
};

export function useDNAStatus() {
  return useQuery({
    queryKey: DNA_KEYS.status(),
    queryFn: () => dnaApi.getDNAStatus(),
    staleTime: 1000 * 30,
  });
}

export function useDNAProfile(dataset?: string) {
  return useQuery({
    queryKey: DNA_KEYS.profile(dataset),
    queryFn: () => dnaApi.getDNAProfile(dataset),
    staleTime: 1000 * 60,
  });
}
