import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/constants/api";

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

const DEFAULT_STATE: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  connectionType: "unknown",
};

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(DEFAULT_STATE);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(`${API_BASE_URL}/health`, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (active) {
          setState((prev) =>
            prev.isConnected ? prev : { ...DEFAULT_STATE }
          );
        }
      } catch {
        if (active) {
          setState({ isConnected: false, isInternetReachable: false, connectionType: "unknown" });
        }
      }
    };

    check();
    timer = setInterval(check, 15000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  return state;
}
