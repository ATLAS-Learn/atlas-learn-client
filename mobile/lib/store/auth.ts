import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api";
import { useUserStore } from "./user";
import { createPersistStorage } from "./persist";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  authMode: "token" | "cookie" | null;
  setAuth: (token: string | null) => void;
  setCookieAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      authMode: null,
      setAuth: (token) => {
        set({ isAuthenticated: !!token, token, authMode: token ? "token" : null });
        if (token) {
          apiClient.setToken(token);
        } else {
          apiClient.setToken(null);
        }
      },
      setCookieAuth: () => {
        set({ isAuthenticated: true, token: null, authMode: "cookie" });
        apiClient.setToken(null);
      },
      logout: async () => {
        try {
          await apiClient.signOut();
        } catch (error) {
          console.error("Error signing out:", error);
        } finally {
          set({ isAuthenticated: false, token: null, authMode: null });
          apiClient.setToken(null);
          useUserStore.getState().clearUser();
        }
      },
    }),
    {
      name: "auth",
      storage: createPersistStorage(),
      partialize: (state) => ({
        token: state.token,
        authMode: state.authMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      },
    }
  )
);
