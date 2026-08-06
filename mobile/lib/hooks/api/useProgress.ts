import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
<<<<<<< HEAD
import { UserRole } from "@/lib/types";
import { useUserStore } from "@/lib/store/user";

export function useOverallProgress() {
    const { user } = useUserStore();
    const isStudent = user?.role === UserRole.STUDENT;

    return useQuery({
        queryKey: ["progress", "overall", user?.id || "anonymous"],
        queryFn: () => apiClient.getOverallProgress(),
        staleTime: 1000 * 60 * 5,
        refetchOnMount: false,
        enabled: Boolean(user?.id && isStudent),
=======
import { OverallProgressData, StreakData } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const PROGRESS_TTL = 1000 * 60 * 5; // 5 minutes

export function useOverallProgress() {
    const initial = getCacheSync<OverallProgressData>("cache:progress:overall");
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
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
    });
}
