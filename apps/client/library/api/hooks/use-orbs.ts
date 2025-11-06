import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import { toast } from "sonner";
import type { Orb, CreateOrbDto } from "../../types/orb";

export const useOrbs = (sectorId?: number) => {
  return useQuery({
    queryKey: ["orbs", sectorId],
    queryFn: async () => {
      if (!sectorId) throw new Error("sectorId is required");
      const { data } = await api.get<{ orbs: Orb[] }>(`/orbs/${sectorId}`);
      return data.orbs;
    },
    enabled: sectorId !== undefined,
  });
};

export const useOrb = (id: number) => {
  return useQuery({
    queryKey: ["orb", id],
    queryFn: async () => {
      const { data } = await api.get<{ orb: Orb }>(`/orbs/detail/${id}`);
      return data.orb;
    },
    enabled: !!id,
  });
};

export const useCreateOrb = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (createData: CreateOrbDto) => {
      const { data } = await api.post<{ orb: Orb }>(`/orbs`, createData);
      return data.orb;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orbs"] });
      queryClient.invalidateQueries({ queryKey: ["orbs", data.sector_id] });
      toast.success("Orb created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create orb");
    },
  });
};

export const useUpdateOrb = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: Partial<Orb>) => {
      const { data } = await api.put<{ orb: Orb }>(`/orbs/${id}`, updateData);
      return data.orb;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orbs"] });
      queryClient.invalidateQueries({ queryKey: ["orbs", data.sector_id] });
      queryClient.invalidateQueries({ queryKey: ["orb", id] });
      toast.success("Orb updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update orb");
    },
  });
};

export const useDeleteOrb = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/orbs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orbs"] });
      toast.success("Orb deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete orb");
    },
  });
};
