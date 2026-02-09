import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { useProgressStore } from "@/lib/store/progress";
import { getItem } from "@/lib/utils/storage";
import { clearAllStorage } from "@/lib/utils/clearStorage";

// TESTING MODE: Set to true to clear all storage on app startup (forces login every time)
// Set to false to allow persistent login (production mode)
const CLEAR_STORAGE_ON_STARTUP = true;

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, loadAuth } = useAuthStore();
  const { user, loadUser } = useUserStore();
  const { loadProgress } = useProgressStore();

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      
      // TESTING MODE: Clear all storage on startup
      if (CLEAR_STORAGE_ON_STARTUP) {
        try {
          await clearAllStorage();
          console.log("✅ All storage cleared on startup (testing mode)");
        } catch (error) {
          console.error("Error clearing storage:", error);
        }
      }
      
      // Load auth state (will be empty if storage was cleared)
      await loadAuth();
    }
    initialize();
  }, []); // Only run once on mount

  useEffect(() => {
    async function loadUserData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      // Load user and progress if authenticated
      await loadUser();
      await loadProgress();

      // Check assessment completion
      const assessment = await getItem("assessmentComplete");
      setAssessmentComplete(assessment === "true");
      setIsLoading(false);
    }

    if (isAuthenticated !== null && isAuthenticated) {
      loadUserData();
    } else if (isAuthenticated === false) {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadUser, loadProgress]);

  return { assessmentComplete, isAuthenticated, user, isLoading };
}
