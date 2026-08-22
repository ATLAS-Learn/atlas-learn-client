import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Chapter } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";
import { DISK_TTL, STALE_TIME } from "@/lib/config/cachePolicy";

export function useChapters() {
    const initial = getCacheSync<Chapter[]>("cache:chapters");

    return useQuery({
        queryKey: ["chapters"],
        queryFn: async () => {
            const data = await apiClient.getChapters();
            try {
                await setCache("cache:chapters", data, DISK_TTL.STATIC);
            } catch {}
            return data;
        },
        staleTime: STALE_TIME.STATIC,
        initialData: initial ?? undefined,
    });
}
