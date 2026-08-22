import { useEffect, useRef } from "react";
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

    // Skip if both already cached
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

    // Skip if both already cached
    if (getCacheSync(chapterCacheKey) && getCacheSync(lessonsCacheKey)) {
        return;
    }

    // Chapter data
    if (!getCacheSync(chapterCacheKey)) {
        try {
            const chapter = await apiClient.getChapter(chapterId);
            await setCache(chapterCacheKey, chapter, CHAPTER_CACHE_TTL);
        } catch {
            // best-effort
        }
    }

    // Lessons list + first lesson content
    if (!getCacheSync(lessonsCacheKey)) {
        try {
            const lessons = await apiClient.getSubjectChapterLessons(subjectId, chapterId, true);
            const list = Array.isArray(lessons) ? lessons : [];
            if (list.length > 0) {
                await setCache(lessonsCacheKey, list, CHAPTER_CACHE_TTL);

                // Prefetch first lesson content for offline reading
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
    const { isConnected, isInternetReachable } = useNetworkState();
    const hasPreloaded = useRef(false);

    useEffect(() => {
        const isOnline = isConnected && isInternetReachable !== false;
        if (!isOnline || hasPreloaded.current) return;
        hasPreloaded.current = true;

        const run = async () => {
            // 1. Read preferred subject IDs from cache
            const preferredIds = getCacheSync<string[]>("cache:preferred-subjects-ids");
            if (!preferredIds || preferredIds.length === 0) return;

            // 2. Preload each preferred subject's data
            await Promise.allSettled(preferredIds.map((id) => preloadSubject(id)));

            // 3. Read learning path to find current chapters
            const learningPath = getCacheSync<{ perSubject?: LearningPathSubject[] }>("cache:learning-path");
            if (!learningPath?.perSubject) return;

            // 4. For each preferred subject, preload the current chapter + its lessons
            for (const subjectId of preferredIds) {
                const subjectData = learningPath.perSubject.find((s) => s.subjectId === subjectId);
                if (!subjectData || subjectData.completionPercentage >= 100) continue;

                const currentId = subjectData.currentChapter?.id;
                if (currentId) {
                    await preloadChapter(subjectId, currentId);
                }

                // Also preload next chapter if available
                const nextId = subjectData.nextRecommended?.id;
                if (nextId && nextId !== currentId) {
                    await preloadChapter(subjectId, nextId);
                }
            }
        };

        // Fire and forget — best-effort, non-blocking
        run().catch(() => {});
    }, [isConnected, isInternetReachable]);
}
