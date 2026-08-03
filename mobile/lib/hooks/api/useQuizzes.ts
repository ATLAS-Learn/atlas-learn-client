import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Quiz, QuizSubmission, QuizResult, QuizAttempt } from "@/lib/types";

export function useQuizzes(chapterId: string | undefined) {
    return useQuery({
        queryKey: ["quizzes", chapterId],
        queryFn: () => apiClient.getChapterQuizzes(chapterId!),
        enabled: !!chapterId,
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
