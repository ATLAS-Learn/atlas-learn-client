import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { setCache, getCacheSync } from "@/lib/utils/cache";
import { LearningPath } from "@/lib/types";

const LEARNING_PATH_TTL = 1000 * 60 * 5; // 5 minutes

export function useLearningPath() {
    const cacheKey = "cache:learning-path";
    const initial = getCacheSync<LearningPath>(cacheKey);
    return useQuery({
        queryKey: ["recommendations", "learning-path"],
        queryFn: async () => {
            try {
                const data = await apiClient.getLearningPath();
                await setCache(cacheKey, data, LEARNING_PATH_TTL);
                return data;
            } catch {
                const cached = getCacheSync<LearningPath>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: LEARNING_PATH_TTL,
        refetchOnMount: true,
        initialData: initial ?? undefined,
        retry: false,
    });
}
