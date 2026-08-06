import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { OverallProgressData, StreakData, UserRole } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";
import { useUserStore } from "@/lib/store/user";

const PROGRESS_TTL = 1000 * 60 * 5; // 5 minutes

export function useOverallProgress() {
    const { user } = useUserStore();
    const isStudent = !user || user?.role === UserRole.STUDENT;
    const initial = getCacheSync<OverallProgressData>("cache:progress:overall");

    return useQuery({
        queryKey: ["progress", "overall", user?.id || "anonymous"],
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
        enabled: isStudent,
        initialData: initial ?? undefined,
    });
}

export function useStreak() {
    const initial = getCacheSync<StreakData>("cache:progress:streak");
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
