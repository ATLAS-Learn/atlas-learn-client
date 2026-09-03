import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Quiz, QuizSubmission, QuizResult, QuizAttempt } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";
import { DISK_TTL, STALE_TIME } from "@/lib/config/cachePolicy";

export function useQuizzes(chapterId: string | undefined) {
    const initial = getCacheSync<Quiz[]>(`cache:quizzes:chapter:${chapterId}`);
    return useQuery({
        queryKey: ["quizzes", chapterId],
        queryFn: async () => {
            const data = await apiClient.getChapterQuizzes(chapterId!);
            try {
                await setCache(`cache:quizzes:chapter:${chapterId}`, data, DISK_TTL.STATIC);
            } catch {}
            return data;
        },
        enabled: !!chapterId,
        staleTime: STALE_TIME.STATIC,
        refetchOnMount: false,
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
                await setCache(`cache:quiz:${quizId}`, data, DISK_TTL.STATIC);
            } catch {}
            return data;
        },
        enabled: !!quizId,
        staleTime: STALE_TIME.STATIC,
        refetchOnMount: false,
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
    const cacheKey = `cache:quiz-attempts:${userId}`;
    const initial = getCacheSync<QuizAttempt[]>(cacheKey);
    return useQuery({
        queryKey: ["users", userId, "quiz-attempts"],
        queryFn: async () => {
            try {
                const data = await apiClient.getUserQuizAttempts(userId!);
                await setCache(cacheKey, data, DISK_TTL.DYNAMIC);
                return data;
            } catch {
                const cached = getCacheSync<QuizAttempt[]>(cacheKey);
                if (cached) return cached;
                throw new Error("Offline");
            }
        },
        enabled: !!userId,
        staleTime: STALE_TIME.QUIZ_ATTEMPTS,
        initialData: initial ?? undefined,
        retry: false,
    });
}
