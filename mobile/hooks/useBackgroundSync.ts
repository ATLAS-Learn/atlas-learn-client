import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { processQuizQueue, processLessonQueue } from "@/lib/utils/syncQueue";

export default function useBackgroundSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;

    const runOnce = async () => {
      try {
        await Promise.all([processQuizQueue(), processLessonQueue()]);
      } catch {
        // ignore
      }
    };

    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!active) return;
        Promise.all([processQuizQueue(), processLessonQueue()]);
      }, 30000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        active = true;
        runOnce();
        startInterval();
      } else {
        active = false;
        stopInterval();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);

    // initial run
    runOnce();
    startInterval();

    return () => {
      subscription.remove();
      stopInterval();
    };
  }, []);
}
