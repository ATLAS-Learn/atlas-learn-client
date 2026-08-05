import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { getItem, setItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";

const USER_CACHE_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token, logout, hasHydrated } = useAuthStore();
  const { user, lastSyncedAt, setUser } = useUserStore();

  useEffect(() => {
    async function restoreSession() {
      if (!hasHydrated) {
        setIsLoading(true);
        return;
      }

      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        apiClient.setToken(token || null);

        const hasUserIdentity = Boolean(user?.id && user?.email && user?.name?.trim());
        const isFreshCache =
          typeof lastSyncedAt === "number" &&
          Date.now() - lastSyncedAt < USER_CACHE_MAX_AGE_MS;
        const requiresFreshIdentity = !hasUserIdentity;
        const shouldRefreshUser = requiresFreshIdentity || !isFreshCache;

        if (shouldRefreshUser) {
          try {
            const freshUser = await apiClient.getCurrentUser();
            setUser(freshUser, { markSynced: true });
          } catch (error) {
            if (requiresFreshIdentity || !user) {
              throw error;
            }
          }
        }

        // Check assessment completion (prefer local, fallback to server once)
        const assessment = await getItem("assessmentComplete");
        if (assessment === "true") {
          setAssessmentComplete(true);
        } else if (assessment === "false") {
          setAssessmentComplete(false);
        } else {
          try {
            const status = await apiClient.getAssessmentStatus();
            const completed = Boolean(status?.completed);
            setAssessmentComplete(completed);
            await setItem("assessmentComplete", completed ? "true" : "false");
          } catch {
            setAssessmentComplete(false);
          }
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error("Session restore failed:", error);
        await logout();
        setIsLoading(false);
      }
    }

    if (!hasHydrated) {
      setIsLoading(true);
      return;
    }

    if (isAuthenticated) {
      restoreSession();
    } else if (isAuthenticated === false) {
      setIsLoading(false);
    }
  }, [hasHydrated, isAuthenticated, token]);

  return { assessmentComplete, isAuthenticated, user, isLoading };
}
