import axios from "axios";
import { useAuthStore } from "@/library/store/auth-store";

const api = axios.create({
  // Use relative path for MSW interception to work properly
  // MSW can only intercept relative paths or same-origin requests
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout on 401
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
