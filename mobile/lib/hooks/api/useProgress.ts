import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useOverallProgress() {
    return useQuery({
        queryKey: ["progress", "overall"],
        queryFn: () => apiClient.getOverallProgress(),
        staleTime: 1000 * 60, // 1 minute - progress changes frequently
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
}

export function useStreak() {
    return useQuery({
        queryKey: ["progress", "streak"],
        queryFn: () => apiClient.getStreak(),
        staleTime: 1000 * 60 * 5, // 5 minutes - streak changes slowly
        refetchOnMount: true,
    });
}
