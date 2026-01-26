import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { useUserStore } from "../store/user";
import { useProgressStore } from "../store/progress";
import { getItem } from "../utils/storage";

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
      // Load auth state
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
