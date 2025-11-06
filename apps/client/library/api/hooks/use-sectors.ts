import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import { toast } from "sonner";
import type { Sector, CreateSectorDto, UpdateSectorDto } from "../../types/sector";

export const useSectors = () => {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const { data } = await api.get<{ sectors: Sector[] }>("/sectors");
      return data.sectors;
    },
  });
};

export const useSector = (id: number) => {
  return useQuery({
    queryKey: ["sector", id],
    queryFn: async () => {
      const { data } = await api.get<Sector>(`/sectors/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (createData: CreateSectorDto) => {
      console.log("[useCreateSector] Sending request:", createData);
      try {
        const { data } = await api.post<Sector>("/sectors", createData);
        console.log("[useCreateSector] Success:", data);
        return data;
      } catch (err) {
        console.error("[useCreateSector] Error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      toast.success("Sector created successfully");
    },
    onError: (error: any) => {
      console.error("[useCreateSector] onError:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create sector";
      console.error("[useCreateSector] Error message:", errorMessage);
      toast.error(errorMessage);
    },
  });
};

export const useUpdateSector = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: UpdateSectorDto) => {
      const { data } = await api.put<Sector>(`/sectors/${id}`, updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      queryClient.invalidateQueries({ queryKey: ["sector", id] });
      toast.success("Sector updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update sector");
    },
  });
};

export const useDeleteSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/sectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
      toast.success("Sector deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete sector");
    },
  });
};
