"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { PortfolioSnapshot, DashboardMetrics, PerformanceMetrics } from "../types";

// ==================== SECTOR-SCOPED HOOKS ====================

export const usePortfolioSnapshots = (sectorId: number) => {
  return useQuery({
    queryKey: ["portfolio", "snapshots", sectorId],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      const response = await api.get<PortfolioSnapshot[]>(`/portfolio/${sectorId}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!sectorId,
  });
};

export const usePortfolioHistory = (sectorId: number, days: number = 30) => {
  return useQuery({
    queryKey: ["portfolio", "history", sectorId, days],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      const response = await api.get<PortfolioSnapshot[]>(`/portfolio/${sectorId}`, {
        params: { days },
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!sectorId && days > 0,
  });
};

export const useDashboardMetrics = (sectorId: number) => {
  return useQuery({
    queryKey: ["dashboard", "metrics", sectorId],
    queryFn: async (): Promise<DashboardMetrics> => {
      const snapshots = await api.get<PortfolioSnapshot[]>(`/portfolio/${sectorId}`);
      const data = snapshots.data;

      if (!data || data.length === 0) {
        return {
          totalValue: 0,
          totalPnl: 0,
          pnlPercentage: 0,
          vsInflationPerformance: 0,
          activeTrades: 0,
          winRate: 0,
          avgHoldTime: "0d",
          bestTrade: "$0",
          worstTrade: "$0",
        };
      }

      const latest = data[0];
      return {
        totalValue: latest.totalValue,
        totalPnl: latest.totalPnl,
        pnlPercentage: latest.pnlPercentage,
        vsInflationPerformance: latest.vsInflationPerformance || 0,
        activeTrades: 0,
        winRate: 0,
        avgHoldTime: "0d",
        bestTrade: "$0",
        worstTrade: "$0",
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    enabled: !!sectorId,
  });
};

export const usePerformanceMetrics = (sectorId: number) => {
  return useQuery({
    queryKey: ["portfolio", "performance", sectorId],
    queryFn: async (): Promise<PerformanceMetrics> => {
      const response = await api.get<PerformanceMetrics>(`/portfolio/${sectorId}/performance`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!sectorId,
  });
};

// ==================== AGGREGATE HOOKS (ALL SECTORS) ====================

export const useAggregatePortfolioSnapshots = () => {
  return useQuery({
    queryKey: ["portfolio", "aggregate", "snapshots"],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      const response = await api.get<PortfolioSnapshot[]>("/portfolio/aggregate");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useAggregateDashboardMetrics = () => {
  return useQuery({
    queryKey: ["dashboard", "metrics", "aggregate"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const snapshots = await api.get<PortfolioSnapshot[]>("/portfolio/aggregate");
      const data = snapshots.data;

      if (!data || data.length === 0) {
        return {
          totalValue: 0,
          totalPnl: 0,
          pnlPercentage: 0,
          vsInflationPerformance: 0,
          activeTrades: 0,
          winRate: 0,
          avgHoldTime: "0d",
          bestTrade: "$0",
          worstTrade: "$0",
        };
      }

      const latest = data[0];
      return {
        totalValue: latest.totalValue,
        totalPnl: latest.totalPnl,
        pnlPercentage: latest.pnlPercentage,
        vsInflationPerformance: latest.vsInflationPerformance || 0,
        activeTrades: 0,
        winRate: 0,
        avgHoldTime: "0d",
        bestTrade: "$0",
        worstTrade: "$0",
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });
};