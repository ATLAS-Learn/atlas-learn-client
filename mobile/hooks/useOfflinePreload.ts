import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Subject, SubjectChapter, LearningPathSubject, LessonWithProgress } from "@/lib/types";
import { DISK_TTL } from "@/lib/config/cachePolicy";
import { getCacheSync, setCache } from "@/lib/utils/cache";
import { useNetworkState } from "@/hooks/useNetworkState";

const SUBJECT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const CHAPTER_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

async function preloadSubject(subjectId: string) {
    const cacheKey = `cache:subject:${subjectId}`;
    const chaptersCacheKey = `cache:subject-chapters:${subjectId}`;

    if (getCacheSync<Subject>(cacheKey) && getCacheSync<SubjectChapter[]>(chaptersCacheKey)) {
        return;
    }

    try {
        const subject = await apiClient.getSubjectById(subjectId, {
            includeChapters: true,
            includeChapterDetails: true,
        });
        await setCache(cacheKey, subject, SUBJECT_CACHE_TTL);

        const chapters = Array.isArray(subject.chapters)
            ? [...subject.chapters].sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            : [];
        if (chapters.length > 0) {
            await setCache(chaptersCacheKey, chapters as SubjectChapter[], CHAPTER_CACHE_TTL);
        }
    } catch {
        // best-effort
    }
}

async function preloadChapter(subjectId: string, chapterId: string) {
    const chapterCacheKey = `cache:chapter:${chapterId}`;
    const lessonsCacheKey = `cache:lessons:${chapterId}`;

    if (getCacheSync(chapterCacheKey) && getCacheSync(lessonsCacheKey)) {
        return;
    }

    if (!getCacheSync(chapterCacheKey)) {
        try {
            const chapter = await apiClient.getChapter(chapterId);
            await setCache(chapterCacheKey, chapter, CHAPTER_CACHE_TTL);
        } catch {
            // best-effort
        }
    }

    if (!getCacheSync(lessonsCacheKey)) {
        try {
            const lessons = await apiClient.getSubjectChapterLessons(subjectId, chapterId, true);
            const list = Array.isArray(lessons) ? lessons : [];
            if (list.length > 0) {
                await setCache(lessonsCacheKey, list, CHAPTER_CACHE_TTL);

                const firstLesson = [...list].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))[0];
                if (firstLesson) {
                    const lessonCacheKey = `cache:lesson:${subjectId}:${chapterId}:${firstLesson.id}`;
                    if (!getCacheSync(lessonCacheKey)) {
                        try {
                            const content = await apiClient.getSubjectChapterLesson(subjectId, chapterId, firstLesson.id, true);
                            await setCache(lessonCacheKey, content, DISK_TTL.STATIC);
                        } catch {
                            // best-effort
                        }
                    }
                }
            }
        } catch {
            // best-effort
        }
    }
}

export default function useOfflinePreload() {
    const queryClient = useQueryClient();
    const { isConnected, isInternetReachable } = useNetworkState();
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current) return;
        hasHydrated.current = true;

        const isOnline = isConnected && isInternetReachable !== false;

        // Always hydrate React Query from MMKV — works offline or online
        const hydrateFromCache = () => {
            const progress = getCacheSync("cache:progress:overall");
            if (progress) {
                queryClient.setQueryData(["progress", "overall"], progress);
            }
            const streak = getCacheSync("cache:progress:streak");
            if (streak) {
                queryClient.setQueryData(["progress", "streak"], streak);
            }
            const learningPath = getCacheSync("cache:learning-path");
            if (learningPath) {
                queryClient.setQueryData(["recommendations", "learning-path"], learningPath);
            }
        };

        hydrateFromCache();

        if (!isOnline) return;

        // Online: fetch fresh data for preferred subjects + current chapters
        const run = async () => {
            const preferredIds = getCacheSync<string[]>("cache:preferred-subjects-ids");
            if (!preferredIds || preferredIds.length === 0) return;

            await Promise.allSettled(preferredIds.map((id) => preloadSubject(id)));

            const lp = getCacheSync<{ perSubject?: LearningPathSubject[] }>("cache:learning-path");
            if (!lp?.perSubject) return;

            for (const subjectId of preferredIds) {
                const subjectData = lp.perSubject.find((s) => s.subjectId === subjectId);
                if (!subjectData || subjectData.completionPercentage >= 100) continue;

                const currentId = subjectData.currentChapter?.id;
                if (currentId) {
                    await preloadChapter(subjectId, currentId);
                }

                const nextId = subjectData.nextRecommended?.id;
                if (nextId && nextId !== currentId) {
                    await preloadChapter(subjectId, nextId);
                }
            }
        };

        run().catch(() => {});
    }, [isConnected, isInternetReachable, queryClient]);
}
