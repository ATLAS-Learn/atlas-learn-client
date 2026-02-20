import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useOverallProgress() {
    return useQuery({
        queryKey: ["progress", "overall"],
        queryFn: () => apiClient.getOverallProgress(),
    });
}
