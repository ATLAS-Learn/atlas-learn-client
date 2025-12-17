import { create } from "zustand";
import { setItem, getItem, removeItem } from "@/utils/storage";
import { apiClient } from "@/services/api";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string | null) => void;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  setAuth: async (token) => {
    set({ isAuthenticated: !!token, token });
    if (token) {
      apiClient.setToken(token);
      await setItem("authToken", token);
    } else {
      apiClient.setToken(null);
      await removeItem("authToken");
    }
  },
  logout: async () => {
    try {
      // Call backend sign-out endpoint
      await apiClient.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      // Continue with local logout even if API call fails
    } finally {
      set({ isAuthenticated: false, token: null });
      apiClient.setToken(null);
      await removeItem("authToken");
    }
  },
  loadAuth: async () => {
    try {
      const token = await getItem("authToken");
      if (token) {
        apiClient.setToken(token);
        set({ isAuthenticated: true, token });
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    }
  },
}));
