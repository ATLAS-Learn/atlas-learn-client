import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { TeacherDashboardData, StudentDetail } from "@/lib/types";

export function useTeacherDashboard() {
    return useQuery({
        queryKey: ["teacher", "dashboard"],
        queryFn: () => apiClient.getTeacherDashboard(),
    });
}

export function useStudentDetail(studentId: string | undefined) {
    return useQuery({
        queryKey: ["teacher", "students", studentId],
        queryFn: () => apiClient.getStudentDetail(studentId!),
        enabled: !!studentId,
    });
}
