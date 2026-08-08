import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { OverallProgressData, StreakData } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const PROGRESS_TTL = 1000 * 60 * 5; // 5 minutes

export function useOverallProgress() {
    const cacheKey = "cache:progress:overall";
    const initial = getCacheSync<OverallProgressData>(cacheKey);
    return useQuery({
        queryKey: ["progress", "overall"],
        queryFn: async () => {
            try {
                const data = await apiClient.getOverallProgress();
                await setCache(cacheKey, data, PROGRESS_TTL);
                return data;
            } catch {
                const cached = getCacheSync<OverallProgressData>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: PROGRESS_TTL,
        refetchOnMount: true,
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
                await setCache(cacheKey, data, PROGRESS_TTL);
                return data;
            } catch {
                const cached = getCacheSync<StreakData>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: PROGRESS_TTL,
        refetchOnMount: true,
        initialData: initial ?? undefined,
        retry: false,
    });
}
