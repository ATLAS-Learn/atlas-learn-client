import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Quiz, QuizSubmission, QuizResult, QuizAttempt } from "@/lib/types";

export function useQuizzes(limit: number = 5) {
    return useQuery({
        queryKey: ["quizzes", limit],
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

export function useUserQuizAttempts(userId: string | undefined) {
    return useQuery({
        queryKey: ["users", userId, "quiz-attempts"],
        queryFn: () => apiClient.getUserQuizAttempts(userId!),
        enabled: !!userId,
    });
}
