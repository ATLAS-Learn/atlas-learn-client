import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { useProgressStore } from "@/lib/store/progress";
import { getItem } from "@/lib/utils/storage";

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
