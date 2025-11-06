import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import { toast } from "sonner";
import type { UserPolicy } from "../types";

export const useSectorPolicy = (sectorId: number) => {
  return useQuery({
    queryKey: ["policy", sectorId],
    queryFn: async () => {
      const { data } = await api.get<UserPolicy>(`/sectors/${sectorId}/policy`);
      return data;
    },
    enabled: !!sectorId,
  });
};

export const useSectorPolicyHistory = (sectorId: number) => {
  return useQuery({
    queryKey: ["policyHistory", sectorId],
    queryFn: async () => {
      const { data } = await api.get<UserPolicy[]>(`/sectors/${sectorId}/policy/history`);
      return data;
    },
    enabled: !!sectorId,
  });
};

export const useCreateSectorPolicy = (sectorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyDocument: any) => {
      const { data } = await api.post(`/sectors/${sectorId}/policy`, { policyDocument });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", sectorId] });
      queryClient.invalidateQueries({ queryKey: ["policyHistory", sectorId] });
      toast.success("Policy created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create policy");
    },
  });
};

export const useUpdateSectorPolicy = (sectorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyDocument: any) => {
      await api.put(`/sectors/${sectorId}/policy`, { policyDocument });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", sectorId] });
      toast.success("Policy updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update policy");
    },
  });
};

export const useActivatePolicyVersion = (sectorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: number) => {
      await api.post(`/sectors/${sectorId}/policy/activate/${version}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", sectorId] });
      queryClient.invalidateQueries({ queryKey: ["policyHistory", sectorId] });
      toast.success("Policy version activated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to activate version");
    },
  });
};
