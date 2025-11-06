"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Trade, JournalEntry, TradingStatus } from "../types";
import api from "../client";

export interface TradePerformanceDetails {
  pnl: number;
  returnPercent: number;
  fee: number;
}

// ==================== SECTOR-SCOPED HOOKS ====================

export const useTrades = (sectorId: number) => {
  return useQuery({
    queryKey: ["trades", "sector", sectorId],
    queryFn: async (): Promise<Trade[]> => {
      const response = await api.get<Trade[]>(`/trades/sector/${sectorId}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!sectorId,
  });
};

// ==================== AGGREGATE HOOKS (ALL SECTORS) ====================

export const useAggregateTrades = () => {
  return useQuery({
    queryKey: ["trades", "aggregate"],
    queryFn: async (): Promise<Trade[]> => {
      const response = await api.get<Trade[]>("/trades/aggregate");
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTradeDetails = (tradeId: string) => {
  return useQuery({
    queryKey: ["trades", tradeId],
    queryFn: async (): Promise<Trade | null> => {
      const response = await api.get<Trade>(`/trades/${tradeId}`);
      return response.data;
    },
    enabled: !!tradeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useTradeJournal = (tradeId: string) => {
  return useQuery({
    queryKey: ["trades", tradeId, "journal"],
    queryFn: async (): Promise<JournalEntry[]> => {
      const response = await api.get<JournalEntry[]>(`/trades/${tradeId}/journal`);
      return response.data;
    },
    enabled: !!tradeId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time updates
  });
};

export const useTradePerformanceDetails = (tradeId: string) => {
  return useQuery({
    queryKey: ["trades", tradeId, "details"],
    queryFn: async (): Promise<TradePerformanceDetails> => {
      const response = await api.get<TradePerformanceDetails>(`/trades/${tradeId}/details`);
      return response.data;
    },
    enabled: !!tradeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTradingStatus = () => {
  return useQuery({
    queryKey: ["trading", "status"],
    queryFn: async (): Promise<TradingStatus> => {
      const response = await api.get<TradingStatus>("/trading/status");
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
};
export const useTradeMutations = () => {
  const queryClient = useQueryClient();

  const approveTrade = useMutation({
    mutationFn: async (tradeId: string): Promise<void> => {
      await api.post(`/trades/${tradeId}/approve`);
    },
    onSuccess: (_, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", tradeId] });
      toast.success("Trade approved successfully");
    },
    onError: () => {
      toast.error("Failed to approve trade");
    },
  });

  const rejectTrade = useMutation({
    mutationFn: async (tradeId: string): Promise<void> => {
      await api.post(`/trades/${tradeId}/reject`);
    },
    onSuccess: (_, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", tradeId] });
      toast.success("Trade rejected");
    },
    onError: () => {
      toast.error("Failed to reject trade");
    },
  });

  const pauseTrading = useMutation({
    mutationFn: async (reason?: string): Promise<void> => {
      await api.post("/trading/pause", { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "status"] });
      toast.success("Trading paused");
    },
    onError: () => {
      toast.error("Failed to pause trading");
    },
  });

  const resumeTrading = useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post("/trading/resume");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "status"] });
      toast.success("Trading resumed");
    },
    onError: () => {
      toast.error("Failed to resume trading");
    },
  });

  return {
    approveTrade: approveTrade.mutate,
    rejectTrade: rejectTrade.mutate,
    pauseTrading: pauseTrading.mutate,
    resumeTrading: resumeTrading.mutate,
    isApproving: approveTrade.isPending,
    isRejecting: rejectTrade.isPending,
    isPausing: pauseTrading.isPending,
    isResuming: resumeTrading.isPending,
  };
};