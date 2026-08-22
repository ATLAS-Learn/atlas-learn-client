import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { setCache, getCacheSync } from "@/lib/utils/cache";
import { LearningPath } from "@/lib/types";

const LEARNING_PATH_STALE = 1000 * 60 * 15; // 15 minutes
const LEARNING_PATH_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export function useLearningPath() {
    const cacheKey = "cache:learning-path";
    const initial = getCacheSync<LearningPath>(cacheKey);
    return useQuery({
        queryKey: ["recommendations", "learning-path"],
        queryFn: async () => {
            try {
                const data = await apiClient.getLearningPath();
                await setCache(cacheKey, data, LEARNING_PATH_CACHE_TTL);
                return data;
            } catch {
                const cached = getCacheSync<LearningPath>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: LEARNING_PATH_STALE,
        refetchOnMount: false,
        initialData: initial ?? undefined,
        retry: false,
    });
}
