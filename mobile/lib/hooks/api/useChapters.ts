import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Chapter } from "@/lib/types";

export function useChapters() {
    return useQuery({
        queryKey: ["chapters"],
        queryFn: () => apiClient.getChapters(),
    });
}

export function useChapter(chapterId: string | undefined) {
    return useQuery({
        queryKey: ["chapters", chapterId],
        queryFn: () => apiClient.getChapter(chapterId!),
        enabled: !!chapterId,
    });
}

export function useChapterQuiz(chapterId: string | undefined) {
    return useQuery({
        queryKey: ["chapters", chapterId, "quiz"],
        queryFn: () => apiClient.getChapterQuiz(chapterId!),
        enabled: !!chapterId,
    });
}
