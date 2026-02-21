import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { useProgressStore } from "@/lib/store/progress";
import { getItem, setItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, loadAuth, token, logout } = useAuthStore();
  const { user, setUser, loadUser } = useUserStore();
  const { loadProgress } = useProgressStore();

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      await Promise.all([loadAuth(), loadUser(), loadProgress()]);
    }
    initialize();
  }, []); // Only run once on mount

  useEffect(() => {
    async function restoreSession() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        // Token sessions use Authorization header, cookie sessions rely on HTTP-only cookie.
        apiClient.setToken(token || null);

        // Fetch user only if we don't already have cached user data.
        if (!user) {
          const freshUser = await apiClient.getCurrentUser();
          setUser(freshUser);
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
        // Token is invalid or expired (401/403)
        console.error("Session restore failed:", error);
        
        // Clear invalid token and logout
        await logout();
        setIsLoading(false);
      }
    }

    if (isAuthenticated !== null && isAuthenticated) {
      restoreSession();
    } else if (isAuthenticated === false) {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, setUser, loadProgress, logout]);

  return { assessmentComplete, isAuthenticated, user, isLoading };
}
