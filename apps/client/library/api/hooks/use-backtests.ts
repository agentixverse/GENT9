import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import { toast } from "sonner";
import type { BacktestResult, BacktestConfig } from "../../types/backtest";

export const useBacktests = () => {
  return useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const { data } = await api.get<BacktestResult[]>("/backtests");
      return data;
    },
    refetchInterval: (data) => {
      // Poll every 3s if any backtest is running
      const hasRunning = data?.some((b) => b.status === "running" || b.status === "pending");
      return hasRunning ? 3000 : false;
    },
  });
};

export const useBacktest = (id: number) => {
  return useQuery({
    queryKey: ["backtest", id],
    queryFn: async () => {
      const { data } = await api.get<BacktestResult>(`/backtests/${id}`);
      return data;
    },
    enabled: !!id,
    refetchInterval: (data) => {
      // Poll every 2s if still running
      return data?.status === "running" || data?.status === "pending" ? 2000 : false;
    },
  });
};

export const useCreateBacktest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: BacktestConfig) => {
      const { data } = await api.post<BacktestResult>("/backtests", config);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtests"] });
      toast.success("Backtest started");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to start backtest");
    },
  });
};

export const useCancelBacktest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/backtests/${id}/cancel`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["backtests"] });
      queryClient.invalidateQueries({ queryKey: ["backtest", id] });
      toast.success("Backtest cancelled");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel backtest");
    },
  });
};
