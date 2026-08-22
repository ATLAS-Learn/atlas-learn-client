import { useEffect, useState } from "react";

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
    let cleanup: (() => void) | null = null;

    // Fully dynamic import — no reference to @react-native-community/netinfo
    // at module scope. This avoids the native bridge crash when the native
    // module isn't linked into the current dev client / release build.
    import("@react-native-community/netinfo").then((mod) => {
      if (!active) return;
      const NetInfo = mod.default ?? mod;
      const sub = NetInfo.addEventListener((info) => {
        if (!active) return;
        setState({
          isConnected: info.isConnected ?? false,
          isInternetReachable: info.isInternetReachable ?? null,
          connectionType: info.type,
        });
      });
      cleanup = () => sub();
    }).catch(() => {
      // Native module unavailable — stay in default "online" state
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return state;
}
