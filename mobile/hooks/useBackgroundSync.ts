import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  processQuizQueue,
  processLessonQueue,
  processFeedbackQueue,
  processSubjectSelectionQueue,
} from '@/lib/utils/syncQueue';
import { useNetworkState } from '@/hooks/useNetworkState';

const DYNAMIC_QUERY_KEYS = [['progress'], ['recommendations', 'learning-path']];

export default function useBackgroundSync() {
  const queryClient = useQueryClient();
  const { isConnected, isInternetReachable } = useNetworkState();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasOffline = useRef(false);

  const processQueues = useCallback(async () => {
    try {
      await Promise.all([
        processQuizQueue(),
        processLessonQueue(),
        processFeedbackQueue(),
        processSubjectSelectionQueue(),
      ]);
    } catch {
      // ignore
    }
  }, []);

  const refreshDynamicQueries = useCallback(() => {
    for (const key of DYNAMIC_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey: key });
    }
    // Also refresh user-specific quiz attempts if we have a userId
    queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'users' && q.queryKey[2] === 'quiz-attempts',
    });
  }, [queryClient]);

  // On reconnect: sync queues + refresh dynamic data
  useEffect(() => {
    const isOnline = isConnected && isInternetReachable !== false;

    if (isOnline && wasOffline.current) {
      processQueues();
      refreshDynamicQueries();
    }

    wasOffline.current = !isOnline;
  }, [
    isConnected,
    isInternetReachable,
    queryClient,
    refreshDynamicQueries,
    processQueues,
  ]);

  // Periodic queue processing while app is active
  useEffect(() => {
    let active = true;

    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!active) return;
        processQueues();
      }, 30000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        active = true;
        processQueues();
        startInterval();
      } else {
        active = false;
        stopInterval();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    // initial run
    processQueues();
    startInterval();

    return () => {
      subscription.remove();
      stopInterval();
    };
  }, [processQueues]);
}
