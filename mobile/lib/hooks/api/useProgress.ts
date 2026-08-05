import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const PROGRESS_TTL = 1000 * 60 * 5; // 5 minutes

export function useOverallProgress() {
    const initial = getCacheSync<any>("cache:progress:overall");
    return useQuery({
        queryKey: ["progress", "overall"],
        queryFn: async () => {
            const data = await apiClient.getOverallProgress();
            try {
                await setCache("cache:progress:overall", data, PROGRESS_TTL);
            } catch {}
            return data;
        },
        staleTime: PROGRESS_TTL,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        initialData: initial ?? undefined,
    });
}

export function useStreak() {
    const initial = getCacheSync<any>("cache:progress:streak");
    return useQuery({
        queryKey: ["progress", "streak"],
        queryFn: async () => {
            const data = await apiClient.getStreak();
            try {
                await setCache("cache:progress:streak", data, PROGRESS_TTL);
            } catch {}
            return data;
        },
        staleTime: PROGRESS_TTL,
        refetchOnMount: true,
        initialData: initial ?? undefined,
    });
}
