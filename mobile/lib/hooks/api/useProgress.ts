import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useOverallProgress() {
    return useQuery({
        queryKey: ["progress", "overall"],
        queryFn: () => apiClient.getOverallProgress(),
        staleTime: 1000 * 30,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
}

export function useStreak() {
    return useQuery({
        queryKey: ["progress", "streak"],
        queryFn: () => apiClient.getStreak(),
        staleTime: 1000 * 60,
        refetchOnMount: true,
    });
}
