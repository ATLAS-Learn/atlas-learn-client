import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { setCache, getCacheSync } from "@/lib/utils/cache";
import { LearningPath } from "@/lib/types";
import { DISK_TTL, STALE_TIME } from "@/lib/config/cachePolicy";

export function useLearningPath() {
    const cacheKey = "cache:learning-path";
    const initial = getCacheSync<LearningPath>(cacheKey);
    return useQuery({
        queryKey: ["recommendations", "learning-path"],
        queryFn: async () => {
            try {
                const data = await apiClient.getLearningPath();
                await setCache(cacheKey, data, DISK_TTL.DYNAMIC);
                return data;
            } catch {
                const cached = getCacheSync<LearningPath>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        staleTime: STALE_TIME.DYNAMIC,
        refetchOnMount: false,
        initialData: initial ?? undefined,
        retry: false,
    });
}
