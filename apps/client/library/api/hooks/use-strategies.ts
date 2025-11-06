import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import { toast } from "sonner";
import type {
  Strategy,
  CreateStrategyRequest,
  CreateStrategyResponse,
  GetStrategiesResponse,
  GetStrategyResponse,
  AddRevisionRequest,
  AddRevisionResponse,
  SetActiveRevisionRequest,
  SetActiveRevisionResponse,
  GetActiveRevisionResponse,
} from "@/library/types/backtest";

/**
 * Fetch all strategies for the current user
 */
export const useStrategies = () => {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const { data } = await api.get<GetStrategiesResponse>("/backtests/strategies");
      return data.strategies;
    },
  });
};

/**
 * Fetch a single strategy by ID
 */
export const useStrategy = (strategyId: number | undefined) => {
  return useQuery({
    queryKey: ["strategies", strategyId],
    queryFn: async () => {
      if (!strategyId) throw new Error("Strategy ID is required");
      const { data } = await api.get<GetStrategyResponse>(`/backtests/strategies/${strategyId}`);
      return data.strategy;
    },
    enabled: !!strategyId,
  });
};

/**
 * Create a new strategy
 */
export const useCreateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (createData: CreateStrategyRequest) => {
      const { data } = await api.post<CreateStrategyResponse>("/backtests/strategies", createData);
      return data.strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create strategy");
    },
  });
};

/**
 * Add a new code revision to a strategy
 */
export const useAddRevision = (strategyId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddRevisionRequest) => {
      const { data } = await api.post<AddRevisionResponse>(
        `/backtests/strategies/${strategyId}/revisions`,
        request
      );
      return data.strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies", strategyId] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("New revision saved");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to save revision");
    },
  });
};

/**
 * Delete a strategy (soft delete)
 */
export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (strategyId: number) => {
      await api.delete(`/backtests/strategies/${strategyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy deleted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete strategy");
    },
  });
};

/**
 * Set the active revision for a strategy
 */
export const useSetActiveRevision = (strategyId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SetActiveRevisionRequest) => {
      const { data } = await api.patch<SetActiveRevisionResponse>(
        `/backtests/strategies/${strategyId}/active`,
        request
      );
      return data.strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies", strategyId] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Active revision updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update active revision");
    },
  });
};

/**
 * Get the active revision for a strategy
 */
export const useActiveRevision = (strategyId: number | undefined) => {
  return useQuery({
    queryKey: ["strategies", strategyId, "active"],
    queryFn: async () => {
      if (!strategyId) throw new Error("Strategy ID is required");
      const { data } = await api.get<GetActiveRevisionResponse>(
        `/backtests/strategies/${strategyId}/active`
      );
      return data.revision;
    },
    enabled: !!strategyId,
  });
};
