import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api";
import { useUserStore } from "./user";
import { createPersistStorage } from "./persist";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  authMode: "token" | "cookie" | null;
  hasHydrated: boolean;
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
      hasHydrated: false,
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
          // clear cached content on logout
          try {
            // dynamic import to avoid cycles
            const { clearCachePrefix, clearCaches } = await import("@/lib/utils/cache");
            const { clearQuizQueue, clearLessonQueue, clearFeedbackQueue, clearSubjectSelectionQueue } = await import("@/lib/utils/syncQueue");
            await Promise.all([
              clearCaches([
                "cache:chapters",
                "cache:progress:overall",
                "cache:progress:streak",
              ]),
              clearCachePrefix("cache:quizzes:"),
              clearQuizQueue(),
              clearLessonQueue(),
              clearFeedbackQueue(),
              clearSubjectSelectionQueue(),
            ]);
          } catch (e) {
            // ignore
          }
        }
      },
    }),
    {
      name: "auth",
      storage: createPersistStorage(),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        authMode: state.authMode,
      }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({ hasHydrated: true });

        if (state) {
          const isAuthenticated = Boolean(state.token || state.authMode === "cookie" || state.isAuthenticated);
          useAuthStore.setState({
            isAuthenticated,
            token: state.token,
            authMode: state.authMode,
          });

          if (state.token) {
            apiClient.setToken(state.token);
          } else {
            apiClient.setToken(null);
          }
        }
      },
    }
  )
);
