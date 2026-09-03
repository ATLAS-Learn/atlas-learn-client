import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { LessonWithProgress } from "@/lib/types";
import { DISK_TTL } from "@/lib/config/cachePolicy";
import { setCache } from "@/lib/utils/cache";

const PREFETCH_LESSONS_AHEAD = 2;

/**
 * Prefetch upcoming lessons in a chapter so they're available offline.
 * Call this when a chapter screen opens or after completing a lesson.
 */
export function useProgressionPrefetch() {
  const queryClient = useQueryClient();

  const prefetchLessonContent = useCallback(
    async (subjectId: string, chapterId: string, lessonId: string) => {
      const cacheKey = `cache:lesson:${subjectId}:${chapterId}:${lessonId}`;
      try {
        const lesson = await apiClient.getSubjectChapterLesson(
          subjectId,
          chapterId,
          lessonId,
          true
        );
        await setCache(cacheKey, lesson, DISK_TTL.STATIC);
        queryClient.setQueryData(["lesson", subjectId, chapterId, lessonId], lesson);
      } catch {
        // silent — prefetch is best-effort
      }
    },
    [queryClient]
  );

  /**
   * When user opens a chapter, prefetch the next N lessons' content
   * starting from the first lesson that isn't already cached.
   */
  const prefetchUpcomingLessons = useCallback(
    async (subjectId: string, chapterId: string, currentLessonId?: string) => {
      try {
        const lessons = await apiClient.getSubjectChapterLessons(subjectId, chapterId, true);
        if (!lessons.length) return;

        const sorted = [...lessons].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );

        let startIndex = 0;
        if (currentLessonId) {
          const idx = sorted.findIndex((l) => l.id === currentLessonId);
          startIndex = idx >= 0 ? idx + 1 : 0;
        }

        const toPrefetch = sorted.slice(startIndex, startIndex + PREFETCH_LESSONS_AHEAD);
        await Promise.allSettled(
          toPrefetch.map((lesson) =>
            prefetchLessonContent(subjectId, chapterId, lesson.id)
          )
        );
      } catch {
        // silent — prefetch is best-effort
      }
    },
    [prefetchLessonContent]
  );

  /**
   * After completing a lesson, prefetch the next lesson in the chapter.
   */
  const prefetchNextLesson = useCallback(
    async (
      subjectId: string,
      chapterId: string,
      completedLessonId: string
    ) => {
      try {
        const lessons = await apiClient.getSubjectChapterLessons(subjectId, chapterId, true);
        if (!lessons.length) return;

        const sorted = [...lessons].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );
        const currentIdx = sorted.findIndex((l) => l.id === completedLessonId);
        const nextLesson = sorted[currentIdx + 1];

        if (nextLesson) {
          await prefetchLessonContent(subjectId, chapterId, nextLesson.id);
        }
      } catch {
        // silent
      }
    },
    [prefetchLessonContent]
  );

  return { prefetchUpcomingLessons, prefetchNextLesson };
}
