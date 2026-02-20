import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { useProgressStore } from "@/lib/store/progress";
import { getItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, loadAuth, token, logout } = useAuthStore();
  const { user, setUser } = useUserStore();
  const { loadProgress } = useProgressStore();

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      await loadAuth();
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

        // Fetch fresh user data from API to validate token and restore session
        const freshUser = await apiClient.getCurrentUser();
        
        // Update user store with fresh data from server
        setUser(freshUser);
        
        // Load progress data
        await loadProgress();

        // Check assessment completion
        const assessment = await getItem("assessmentComplete");
        setAssessmentComplete(assessment === "true");
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
