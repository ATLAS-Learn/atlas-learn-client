import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Quiz, QuizSubmission, UserQuizAttempt, UserQuizAttemptsQueryParams } from "@/lib/types";
import { setCache, getCacheSync } from "@/lib/utils/cache";

const STATIC_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

function isBackendUserId(userId: string | undefined): userId is string {
    if (!userId) return false;
    return /^c[a-z0-9]{8,}$/i.test(userId);
}

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

export function useUserQuizAttempts(
    userId: string | undefined,
    params: UserQuizAttemptsQueryParams = {}
) {
    const canFetchAttempts = isBackendUserId(userId) || Boolean(userId);

    return useQuery<UserQuizAttempt[]>({
        queryKey: ["users", userId, "quiz-attempts", params.quizId ?? "all", params.limit ?? 10, params.offset ?? 0],
        queryFn: () => apiClient.getUserQuizAttempts(userId!, params),
        enabled: !!userId,
        staleTime: 1000 * 60,
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
