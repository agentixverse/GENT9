import { useQuery } from "@tanstack/react-query";
import { api } from "../client";
import type { ThreadRegistryEntry, ThreadType } from "../types";

/**
 * Hook to fetch available thread providers from the registry
 * @param type - Optional thread type to filter by
 */
export const useThreadRegistry = (type?: ThreadType) => {
  return useQuery({
    queryKey: ["thread-registry", type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : "";

      if (type) {
        // When filtering by type, backend returns { threads: [...] }
        const { data } = await api.get<{ threads: ThreadRegistryEntry[] }>(
          `/thread-registry${params}`
        );
        return data.threads;
      } else {
        // When not filtering, backend returns grouped object
        const { data } = await api.get<Record<ThreadType, ThreadRegistryEntry[]>>(
          `/thread-registry`
        );
        return data;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (matches cron interval)
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch available network infrastructure threads
 * Convenience wrapper for useThreadRegistry("network_infra")
 */
export const useNetworkThreads = () => {
  return useThreadRegistry("network_infra");
};
