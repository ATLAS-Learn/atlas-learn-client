import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { getItem } from "../utils/storage";

export function useAppFlow() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function checkOnboarding() {
      const onboarded = await getItem("onboardingComplete");
      setOnboardingComplete(onboarded === "true");
    }
    checkOnboarding();
  }, []);

  return { onboardingComplete, isAuthenticated };
}
