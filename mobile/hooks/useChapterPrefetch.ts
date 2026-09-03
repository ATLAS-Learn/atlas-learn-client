import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Chapter, LearningPathSubject, LessonWithProgress, SubjectChapter } from "@/lib/types";
import { DISK_TTL } from "@/lib/config/cachePolicy";
import { getCacheSync, setCache } from "@/lib/utils/cache";
import { useNetworkState } from "@/hooks/useNetworkState";
import { getRecentSubjects } from "@/lib/utils/recentSubjects";

const CHAPTER_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function isChapterCached(chapterId: string): boolean {
    return !!getCacheSync<Chapter>(`cache:chapter:${chapterId}`);
}

function isLessonsCached(chapterId: string): boolean {
    return !!getCacheSync<LessonWithProgress[]>(`cache:lessons:${chapterId}`);
}

function findNextChapterId(
    subjectId: string,
    currentChapterId: string
): string | null {
    // Try ordered chapters from cache
    const chapters = getCacheSync<SubjectChapter[]>(`cache:subject-chapters:${subjectId}`);
    if (chapters && chapters.length > 0) {
        const sorted = [...chapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        const idx = sorted.findIndex((c) => c.id === currentChapterId);
        if (idx >= 0 && idx < sorted.length - 1) {
            return sorted[idx + 1].id;
        }
    }
    return null;
}

async function prefetchChapter(subjectId: string, chapterId: string) {
    // 1. Chapter data
    if (!isChapterCached(chapterId)) {
        try {
            const chapter = await apiClient.getChapter(chapterId);
            await setCache(`cache:chapter:${chapterId}`, chapter, CHAPTER_CACHE_TTL);
        } catch {
            // best-effort
        }
    }

    // 2. Lessons list
    let lessons: LessonWithProgress[] = [];
    if (!isLessonsCached(chapterId)) {
        try {
            const data = await apiClient.getSubjectChapterLessons(subjectId, chapterId, true);
            lessons = Array.isArray(data) ? data : [];
            if (lessons.length > 0) {
                await setCache(`cache:lessons:${chapterId}`, lessons, CHAPTER_CACHE_TTL);
            }
        } catch {
            // best-effort
        }
    } else {
        lessons = getCacheSync<LessonWithProgress[]>(`cache:lessons:${chapterId}`) || [];
    }

    // 3. All lesson contents
    if (lessons.length > 0) {
        await Promise.allSettled(
            lessons.map(async (lesson) => {
                const cacheKey = `cache:lesson:${subjectId}:${chapterId}:${lesson.id}`;
                if (getCacheSync(cacheKey)) return;
                try {
                    const content = await apiClient.getSubjectChapterLesson(
                        subjectId,
                        chapterId,
                        lesson.id,
                        true
                    );
                    await setCache(cacheKey, content, DISK_TTL.STATIC);
                } catch {
                    // best-effort
                }
            })
        );
    }

    // 4. Quizzes
    const quizCacheKey = `cache:quizzes:chapter:${chapterId}`;
    if (!getCacheSync(quizCacheKey)) {
        try {
            const quizzes = await apiClient.getChapterQuizzes(chapterId);
            if (Array.isArray(quizzes) && quizzes.length > 0) {
                await setCache(quizCacheKey, quizzes, DISK_TTL.STATIC);
            }
        } catch {
            // best-effort
        }
    }
}

export default function useChapterPrefetch() {
    const queryClient = useQueryClient();
    const { isConnected, isInternetReachable } = useNetworkState();
    const prefetchedRef = useRef<Set<string>>(new Set());

    const runPrefetch = () => {
        const isOnline = isConnected && isInternetReachable !== false;
        if (!isOnline) return;

        const learningPath = queryClient.getQueryData<{ perSubject?: LearningPathSubject[] }>([
            "recommendations",
            "learning-path",
        ]);

        if (!learningPath?.perSubject) return;

        // Get all recently visited subjects
        const recentEntries = getRecentSubjects();
        if (recentEntries.length === 0) return;

        for (const { subjectId } of recentEntries) {
            const subjectData = learningPath.perSubject.find(
                (s) => s.subjectId === subjectId
            );

            if (!subjectData || subjectData.completionPercentage >= 100) continue;

            const currentId = subjectData.currentChapter?.id;
            if (!currentId) continue;

            // Find the chapter after current in the ordered list
            let nextId = findNextChapterId(subjectId, currentId);

            // Fallback: use server's nextRecommended if different from current
            if (!nextId && subjectData.nextRecommended?.id !== currentId) {
                nextId = subjectData.nextRecommended?.id || null;
            }

            if (!nextId) continue;
            if (prefetchedRef.current.has(nextId)) continue;
            if (isChapterCached(nextId) && isLessonsCached(nextId)) continue;

            prefetchedRef.current.add(nextId);
            prefetchChapter(subjectId, nextId).catch(() => {});
        }
    };

    // Run on mount + network changes
    useEffect(() => {
        runPrefetch();
    }, [isConnected, isInternetReachable, queryClient]);

    // Re-run when progress data changes (lesson completion may shift currentChapter)
    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            if (
                event.type === "updated" &&
                Array.isArray(event.query.queryKey) &&
                event.query.queryKey[0] === "progress"
            ) {
                setTimeout(() => {
                    runPrefetch();
                }, 3000);
            }
        });

        return unsubscribe;
    }, [queryClient]);
}
