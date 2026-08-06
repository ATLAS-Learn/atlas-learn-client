import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
<<<<<<< HEAD
import { QuizSubmission, UserQuizAttempt, UserQuizAttemptsQueryParams } from "@/lib/types";

function isBackendUserId(userId: string | undefined): userId is string {
    if (!userId) return false;
    return /^c[a-z0-9]{8,}$/i.test(userId);
}

export function useQuizzes(limit?: number) {
    return useQuery({
        queryKey: ["quizzes", limit ?? "all"],
        queryFn: () => apiClient.getQuizzes(limit),
=======
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
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
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

<<<<<<< HEAD
export function useUserQuizAttempts(
    userId: string | undefined,
    params: UserQuizAttemptsQueryParams = {}
) {
    const canFetchAttempts = isBackendUserId(userId);

    return useQuery<UserQuizAttempt[]>({
        queryKey: ["users", userId, "quiz-attempts", params.quizId ?? "all", params.limit ?? 10, params.offset ?? 0],
        queryFn: () => apiClient.getUserQuizAttempts(userId!, params),
        enabled: canFetchAttempts,
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
=======
export function useUserQuizAttempts(userId: string | undefined) {
    return useQuery({
        queryKey: ["users", userId, "quiz-attempts"],
        queryFn: () => apiClient.getUserQuizAttempts(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60, // 1 minute - attempts change frequently
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
    });
}
