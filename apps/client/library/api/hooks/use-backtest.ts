import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import api from "../client";
import { toast } from "sonner";
import type {
  RunBacktestRequest,
  RunBacktestResponse,
  BacktestResults,
  GetBacktestResultsResponse,
} from "@/library/types/backtest";
import { useStrategy } from "./use-strategies";

/**
 * Run a backtest for a specific strategy revision
 */
export const useRunBacktest = (strategyId: number, revisionIndex: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: RunBacktestRequest) => {
      const { data } = await api.post<RunBacktestResponse>(
        `/backtests/strategies/${strategyId}/revisions/${revisionIndex}/run`,
        config
      );
      return data;
    },
    onSuccess: (data) => {
      // Start polling for status updates
      queryClient.invalidateQueries({ queryKey: ["strategies", strategyId] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success(data.message || "Backtest queued successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to queue backtest";
      toast.error(message);
    },
  });
};

/**
 * Fetch backtest results for a specific revision
 */
export const useBacktestResults = (
  strategyId: number | undefined,
  revisionIndex: number | undefined,
  enabled = true
) => {
  return useQuery({
    queryKey: ["backtest-results", strategyId, revisionIndex],
    queryFn: async () => {
      if (strategyId === undefined || revisionIndex === undefined) {
        throw new Error("Strategy ID and revision index are required");
      }
      const { data } = await api.get<GetBacktestResultsResponse>(
        `/backtests/strategies/${strategyId}/revisions/${revisionIndex}/results`
      );
      return data.results;
    },
    enabled: enabled && strategyId !== undefined && revisionIndex !== undefined && revisionIndex >= 0,
    retry: false, // Don't retry if results don't exist yet
  });
};

/**
 * Fetch HTML report for a specific revision
 */
export const useBacktestReport = (
  strategyId: number | undefined,
  revisionIndex: number | undefined
) => {
  return useQuery({
    queryKey: ["backtest-report", strategyId, revisionIndex],
    queryFn: async () => {
      if (strategyId === undefined || revisionIndex === undefined) {
        throw new Error("Strategy ID and revision index are required");
      }
      const { data } = await api.get<string>(
        `/backtests/strategies/${strategyId}/revisions/${revisionIndex}/report`,
        {
          headers: { Accept: "text/html" },
        }
      );
      return data;
    },
    enabled: !!strategyId && revisionIndex !== undefined && revisionIndex >= 0,
    retry: false,
  });
};

/**
 * Poll strategy status during backtest execution
 * Polls every 3 seconds while status is "queued" or "running"
 */
export const useBacktestStatusPoller = (strategyId: number | undefined) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: strategy } = useStrategy(strategyId);

  useEffect(() => {
    if (!strategy || !strategyId) return;

    const shouldPoll = strategy.status === "queued" || strategy.status === "running";

    if (shouldPoll) {
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["strategies", strategyId] });
      }, 3000); // Poll every 3 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [strategy?.status, strategyId, queryClient]);

  return {
    isPolling: !!intervalRef.current,
    status: strategy?.status,
  };
};
