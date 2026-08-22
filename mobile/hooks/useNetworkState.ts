import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
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

// Singleton: one poller shared by all hook consumers
let globalState: NetworkState = DEFAULT_STATE;
let listeners: Set<(s: NetworkState) => void> = new Set();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let netInfoUnsubscribe: (() => void) | null = null;

function emit(state: NetworkState) {
  globalState = state;
  listeners.forEach((fn) => fn(state));
}

async function checkServerReachable(isConnected: boolean): Promise<boolean> {
  if (!isConnected) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(`${API_BASE_URL}/health`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

function ensurePoller() {
  if (pollTimer) return; // already running

  // Subscribe to NetInfo for local connectivity (no server request)
  netInfoUnsubscribe = NetInfo.addEventListener((info: NetInfoState) => {
    const isConnected = info.isConnected ?? false;
    const connectionType = info.type ?? "unknown";

    if (!isConnected) {
      emit({ isConnected: false, isInternetReachable: false, connectionType });
    } else {
      // Connected locally — check server reachability
      checkServerReachable(true).then((reachable) => {
        emit({ isConnected: true, isInternetReachable: reachable, connectionType });
      });
    }
  });

  // Fallback poll for server reachability every 60s (in case NetInfo stays connected but server goes down)
  pollTimer = setInterval(async () => {
    const info = await NetInfo.fetch();
    const isConnected = info.isConnected ?? false;
    if (!isConnected) return;
    const reachable = await checkServerReachable(true);
    emit({
      isConnected: true,
      isInternetReachable: reachable,
      connectionType: info.type ?? "unknown",
    });
  }, 60000);
}

function stopPollerIfIdle() {
  if (listeners.size > 0) return;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
}

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    ensurePoller();

    return () => {
      listeners.delete(setState);
      stopPollerIfIdle();
    };
  }, []);

  return state;
}
