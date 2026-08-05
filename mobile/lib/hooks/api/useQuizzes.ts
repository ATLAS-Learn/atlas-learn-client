import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Quiz, QuizSubmission, QuizResult, QuizAttempt } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const STATIC_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export function useQuizzes(chapterId: string | undefined) {
    const initial = getCacheSync<Quiz[]>(`cache:quizzes:chapter:${chapterId}`);
    return useQuery({
        queryKey: ["quizzes", chapterId],
        queryFn: async () => {
            const data = await apiClient.getChapterQuizzes(chapterId!);
            try {
                await setCache(`cache:quizzes:chapter:${chapterId}`, data, STATIC_TTL);
            } catch {}
            return data;
        },
        enabled: !!chapterId,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours in memory
        initialData: initial ?? undefined,
    });
}

export function useQuiz(quizId: string | undefined) {
    const initial = getCacheSync<Quiz>(`cache:quiz:${quizId}`);
    return useQuery({
        queryKey: ["quizzes", quizId],
        queryFn: async () => {
            const data = await apiClient.getQuiz(quizId!);
            try {
                await setCache(`cache:quiz:${quizId}`, data, STATIC_TTL);
            } catch {}
            return data;
        },
        enabled: !!quizId,
        staleTime: 1000 * 60 * 60 * 24,
        initialData: initial ?? undefined,
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
        staleTime: 1000 * 60, // 1 minute - attempts change frequently
    });
}
