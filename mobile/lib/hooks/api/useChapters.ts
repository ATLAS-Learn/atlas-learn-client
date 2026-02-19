import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useChapters() {
    return useQuery({
        queryKey: ["chapters"],
        queryFn: () => apiClient.getChapters(),
    });
}
