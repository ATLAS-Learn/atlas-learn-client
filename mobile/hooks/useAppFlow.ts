import { useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { getItem, setItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";
import { User } from "@/lib/types";

// Module-level state: survives React remounts of RootLayout.
// Restore runs at most once per token for the entire JS session.
let restoreCache: { token: string | null; valid: boolean } | null = null;
let inFlight: { token: string | null; promise: Promise<boolean> } | null = null;

function ensureSessionRestored(token: string | null): Promise<boolean> {
  if (restoreCache && restoreCache.token === token) {
    return Promise.resolve(restoreCache.valid);
  }
  if (inFlight && inFlight.token === token) {
    return inFlight.promise;
  }

  const promise = (async (): Promise<boolean> => {
    apiClient.setToken(token);

    let freshUser: User | null = null;
    try {
      // Single call serves as BOTH session validation and identity refresh
      freshUser = await apiClient.getCurrentUser();
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        restoreCache = { token, valid: false };
        return false;
      }
      // Network error — session stays valid locally (offline-first)
      restoreCache = { token, valid: true };
      return true;
    }

    // Populate identity if missing (first install / cleared storage)
    const { user, setUser } = useUserStore.getState();
    if ((!user?.id || !user?.email) && freshUser) {
      setUser(freshUser, { markSynced: true });
    }

    // Resolve assessment status once if not cached locally
    const assessment = await getItem("assessmentComplete");
    if (assessment !== "true" && assessment !== "false") {
      try {
        const status = await apiClient.getAssessmentStatus();
        const completed = Boolean(status?.completed);
        await setItem("assessmentComplete", completed ? "true" : "false");
      } catch {
        // Offline — will resolve next launch
      }
    }

    restoreCache = { token, valid: true };
    return true;
  })();

  inFlight = { token, promise };
  promise.finally(() => {
    if (inFlight?.token === token) inFlight = null;
  });
  return promise;
}

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useUserStore((s) => s.user);
  const appState = useRef(AppState.currentState);

  // Session restore - runs once when hydration completes
  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    ensureSessionRestored(token)
      .then(async (valid) => {
        if (cancelled) return;
        if (!valid) {
          await useAuthStore.getState().logout();
          setIsLoading(false);
          return;
        }
        const assessment = await getItem("assessmentComplete");
        if (cancelled) return;
        setAssessmentComplete(assessment === "true");
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, token]);

  // Re-validate session when app comes to foreground (auth check only)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        apiClient.setToken(token || null);
        // Invalidate cached restore so next cold start re-validates
        try {
          await apiClient.getCurrentUser();
        } catch (error: any) {
          const msg = String(error?.message ?? "");
          if (msg.includes("401") || msg.includes("Unauthorized")) {
            restoreCache = null;
            await useAuthStore.getState().logout();
          }
          // Network errors are fine — session is still valid locally
        }
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, token]);

  return { assessmentComplete, isAuthenticated, user, isLoading };
}
