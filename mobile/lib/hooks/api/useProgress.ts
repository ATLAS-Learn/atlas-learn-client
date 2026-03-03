import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
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
    });
}
