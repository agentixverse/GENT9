"use client";

import { useQuery } from "@tanstack/react-query";
import type { AIActivity, AIDecision } from "../types";
import api from "../client";

export const useAIActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ["ai", "activity", limit],
    queryFn: async (): Promise<AIActivity[]> => {
      const response = await api.get<AIActivity[]>(`/ai/activity?limit=${limit}`);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for real-time updates
  });
};

export const useAIDecisions = () => {
  return useQuery({
    queryKey: ["ai", "decisions"],
    queryFn: async (): Promise<AIDecision[]> => {
      const response = await api.get<AIDecision[]>("/ai/decisions");
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useLatestAIActivity = () => {
  return useQuery({
    queryKey: ["ai", "activity", "latest"],
    queryFn: async (): Promise<AIActivity[]> => {
      const response = await api.get<AIActivity[]>("/ai/activity?limit=5");
      return response.data;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
  });
};