import { useEffect, useState, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { getItem, setItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";

const USER_CACHE_MAX_AGE_MS = 1000 * 60 * 30;

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token, logout, hasHydrated } = useAuthStore();
  const { user, lastSyncedAt, setUser } = useUserStore();
  const appState = useRef(AppState.currentState);
  const sessionChecked = useRef(false);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      await apiClient.getCurrentUser();
      return true;
    } catch (error: any) {
      if (error?.message?.includes("401") || error?.message?.includes("Unauthorized") || error?.message?.includes("session")) {
        return false;
      }
      return true;
    }
  }, []);

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

        const isValid = await validateSession();
        if (cancelled) return;

        if (!isValid) {
          await logout();
          setIsLoading(false);
          return;
        }

        const hasUserIdentity = Boolean(user?.id && user?.email && user?.name?.trim());
        const isFreshCache = typeof lastSyncedAt === "number" && Date.now() - lastSyncedAt < USER_CACHE_MAX_AGE_MS;
        const shouldRefreshUser = !hasUserIdentity || !isFreshCache;

        if (shouldRefreshUser) {
          try {
            const freshUser = await apiClient.getCurrentUser();
            if (!cancelled) setUser(freshUser, { markSynced: true });
          } catch (error) {
            if (!hasUserIdentity && !cancelled) throw error;
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

  // Re-validate when app comes to foreground
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        apiClient.setToken(token || null);
        const isValid = await validateSession();
        if (!isValid) {
          await logout();
        }
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, token, logout, validateSession]);

  return { assessmentComplete, isAuthenticated, user, isLoading };
}
