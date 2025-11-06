import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,

        setAuth: (user, token) =>
          set((state) => {
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.isLoading = false;
          }),

        clearAuth: () =>
          set((state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          }),

        updateUser: (userData) =>
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...userData };
            }
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            state.isLoading = false;
          }),
      })),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);
