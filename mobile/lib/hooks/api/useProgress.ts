import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { OverallProgressData, StreakData } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const STALE_TIME = 1000 * 60 * 15; // 15 minutes
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export function useOverallProgress() {
    const cacheKey = "cache:progress:overall";
    const initial = getCacheSync<OverallProgressData>(cacheKey);
    return useQuery({
        queryKey: ["progress", "overall"],
        queryFn: async () => {
            try {
                const data = await apiClient.getOverallProgress();
                await setCache(cacheKey, data, CACHE_TTL);
                return data;
            } catch {
                const cached = getCacheSync<OverallProgressData>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: STALE_TIME,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        initialData: initial ?? undefined,
        retry: false,
    });
}

export function useStreak() {
    const cacheKey = "cache:progress:streak";
    const initial = getCacheSync<StreakData>(cacheKey);
    return useQuery({
        queryKey: ["progress", "streak"],
        queryFn: async () => {
            try {
                const data = await apiClient.getStreak();
                await setCache(cacheKey, data, CACHE_TTL);
                return data;
            } catch {
                const cached = getCacheSync<StreakData>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: STALE_TIME,
        refetchOnMount: false,
        initialData: initial ?? undefined,
        retry: false,
    });
}
