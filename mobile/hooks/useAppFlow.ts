import { useEffect, useState, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { getItem, setItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token, logout, hasHydrated } = useAuthStore();
  const { user, setUser } = useUserStore();
  const appState = useRef(AppState.currentState);
  const sessionChecked = useRef(false);

  // Session restore - runs once when hydration completes
  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Already checked this session
    if (sessionChecked.current) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      try {
        apiClient.setToken(token || null);

        // Check if session is still valid (401 = logged out)
        try {
          await apiClient.getCurrentUser();
        } catch (error: any) {
          if (error?.message?.includes("401") || error?.message?.includes("Unauthorized") || error?.message?.includes("session")) {
            if (!cancelled) {
              await logout();
              setIsLoading(false);
            }
            return;
          }
          // Network error — treat as valid, user data is in MMKV
        }

        if (cancelled) return;

        // User data is already in MMKV from Zustand persist. Only refresh if
        // we have no identity at all (first install / cleared storage).
        const hasUserIdentity = Boolean(user?.id && user?.email && user?.name?.trim());
        if (!hasUserIdentity) {
          try {
            const freshUser = await apiClient.getCurrentUser();
            if (!cancelled) setUser(freshUser, { markSynced: true });
          } catch {
            // Network unavailable — rely on persisted data
          }
        }

        if (cancelled) return;

        const assessment = await getItem("assessmentComplete");
        if (assessment === "true") {
          setAssessmentComplete(true);
        } else if (assessment === "false") {
          setAssessmentComplete(false);
        } else {
          try {
            const status = await apiClient.getAssessmentStatus();
            if (!cancelled) {
              const completed = Boolean(status?.completed);
              setAssessmentComplete(completed);
              await setItem("assessmentComplete", completed ? "true" : "false");
            }
          } catch {
            if (!cancelled) setAssessmentComplete(false);
          }
        }

        sessionChecked.current = true;
        if (!cancelled) setIsLoading(false);
      } catch (error: any) {
        console.error("Session restore failed:", error);
        if (!cancelled) {
          await logout();
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => { cancelled = true; };
  }, [hasHydrated, isAuthenticated]);

  // Re-validate session when app comes to foreground (only checks auth, no user refetch)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        apiClient.setToken(token || null);
        try {
          await apiClient.getCurrentUser();
        } catch (error: any) {
          if (error?.message?.includes("401") || error?.message?.includes("Unauthorized") || error?.message?.includes("session")) {
            await logout();
          }
          // Network errors are fine — session is still valid locally
        }
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, token, logout]);

  return { assessmentComplete, isAuthenticated, user, isLoading };
}
