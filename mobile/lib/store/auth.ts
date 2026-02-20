import { create } from "zustand";
import { setItem, removeItem, getItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";
import { useUserStore } from "./user";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  authMode: "token" | "cookie" | null;
  setAuth: (token: string | null) => void;
  setCookieAuth: () => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  authMode: null,
  setAuth: async (token) => {
    set({ isAuthenticated: !!token, token, authMode: token ? "token" : null });
    if (token) {
      apiClient.setToken(token);
      await setItem("authToken", token);
      await removeItem("authSessionMode");
    } else {
      apiClient.setToken(null);
      await removeItem("authToken");
      await removeItem("authSessionMode");
    }
  },
  setCookieAuth: async () => {
    set({ isAuthenticated: true, token: null, authMode: "cookie" });
    apiClient.setToken(null);
    await removeItem("authToken");
    await setItem("authSessionMode", "cookie");
  },
  logout: async () => {
    try {
      // Call backend sign-out endpoint
      await apiClient.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      // Continue with local logout even if API call fails
    } finally {
      set({ isAuthenticated: false, token: null, authMode: null });
      apiClient.setToken(null);
      await removeItem("authToken");
      await removeItem("authSessionMode");
      
      // Clear user data
      const { clearUser } = useUserStore.getState();
      await clearUser();
    }
  },
  loadAuth: async () => {
    try {
      const token = await getItem("authToken");
      if (token) {
        apiClient.setToken(token);
        set({ isAuthenticated: true, token, authMode: "token" });
        return;
      }

      const sessionMode = await getItem("authSessionMode");
      if (sessionMode === "cookie") {
        apiClient.setToken(null);
        set({ isAuthenticated: true, token: null, authMode: "cookie" });
      } else {
        set({ isAuthenticated: false, token: null, authMode: null });
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    }
  },
}));
