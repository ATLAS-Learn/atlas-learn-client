import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { useUserStore } from "../store/user";
import { useProgressStore } from "../store/progress";
import { getItem } from "../utils/storage";

export function useAppFlow() {
  const [assessmentComplete, setAssessmentComplete] = useState<boolean | null>(
    null
  );
  const { isAuthenticated, loadAuth } = useAuthStore();
  const { user, loadUser } = useUserStore();
  const { loadProgress } = useProgressStore();

  useEffect(() => {
    async function initialize() {
      // Load auth state
      await loadAuth();
      
      // Load user and progress if authenticated
      if (isAuthenticated) {
        await loadUser();
        await loadProgress();
      }

      // Check assessment completion
      const assessment = await getItem("assessmentComplete");
      setAssessmentComplete(assessment === "true");
    }
    initialize();
  }, [isAuthenticated, loadAuth, loadUser, loadProgress]);

  return { assessmentComplete, isAuthenticated, user };
}
