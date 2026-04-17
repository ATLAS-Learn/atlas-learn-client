import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { QuizSubmission, UserQuizAttempt, UserQuizAttemptsQueryParams } from "@/lib/types";

export function useQuizzes(limit?: number) {
    return useQuery({
        queryKey: ["quizzes", limit ?? "all"],
        queryFn: () => apiClient.getQuizzes(limit),
    });
}

export function useQuiz(quizId: string | undefined) {
    return useQuery({
        queryKey: ["quizzes", quizId],
        queryFn: () => apiClient.getQuiz(quizId!),
        enabled: !!quizId,
    });
}

export function useSubmitQuiz() {
    return useMutation({
        mutationFn: ({ quizId, submission }: { quizId: string; submission: QuizSubmission }) =>
            apiClient.submitQuiz(quizId, submission),
    });
}

export function useUserQuizAttempts(
    userId: string | undefined,
    params: UserQuizAttemptsQueryParams = {}
) {
    return useQuery<UserQuizAttempt[]>({
        queryKey: ["users", userId, "quiz-attempts", params.quizId ?? "all", params.limit ?? 10, params.offset ?? 0],
        queryFn: () => apiClient.getUserQuizAttempts(userId!, params),
        enabled: !!userId,
    });
}

export function useQuizAttempts(quizId: string | undefined) {
    return useQuery({
        queryKey: ["quizzes", quizId, "attempts"],
        queryFn: () => apiClient.getQuizAttempts(quizId!),
        enabled: !!quizId,
    });
}

export function useQuizStats(quizId: string | undefined) {
    return useQuery({
        queryKey: ["quizzes", quizId, "stats"],
        queryFn: () => apiClient.getQuizStats(quizId!),
        enabled: !!quizId,
    });
}
