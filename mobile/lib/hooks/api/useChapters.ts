import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const STATIC_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export function useChapters() {
    const initial = getCacheSync<any[]>("cache:chapters");

    return useQuery({
        queryKey: ["chapters"],
        queryFn: async () => {
            const data = await apiClient.getChapters();
            // persist static cache
            try {
                await setCache("cache:chapters", data, STATIC_TTL);
            } catch {}
            return data;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours in memory
        initialData: initial ?? undefined,
    });
}
