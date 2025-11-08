import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import { toast } from "sonner";

interface Profile {
  id: number;
  email: string;
  settings?: Record<string, any> | null;
  created_at: string;
  updated_at?: string | null;
}

interface UpdateProfileData {
  email?: string;
  settings?: Record<string, any>;
}

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get<Profile>("/profile");
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: UpdateProfileData) => {
      await api.put("/profile", updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });
};
