import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useLearningPath() {
    return useQuery({
        queryKey: ["recommendations", "learning-path"],
        queryFn: () => apiClient.getLearningPath(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnMount: true,
    });
}
