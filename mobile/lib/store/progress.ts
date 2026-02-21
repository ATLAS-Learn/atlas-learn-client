import { create } from "zustand";
import { Progress, ChapterProgress } from "@/lib/types";
import { setItem, getItem, removeItem } from "@/lib/utils/storage";

interface ProgressState {
    progress: Progress | null;
    chapterProgress: Record<string, ChapterProgress>;
    setProgress: (progress: Progress) => void;
    updateCurrentChapter: (chapterId: string) => void;
    completeChapter: (chapterId: string) => void;
    completeLesson: (lessonId: string) => void;
    completeQuiz: (quizId: string) => void;
    updateStreak: (streak: number) => void;
    updateOverallProgress: (percentage: number) => void;
    calculateOverallProgress: (allChapters: any[], allQuizzes: any[]) => Promise<number>;
    loadProgress: () => Promise<void>;
    clearProgress: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    progress: null,
    chapterProgress: {},
    setProgress: (progress) => {
        set({ progress });
        setItem("progress", JSON.stringify(progress));
    },
    updateCurrentChapter: (chapterId) =>
        set((state) => {
            if (state.progress) {
                const updated = { ...state.progress, currentChapterId: chapterId };
                setItem("progress", JSON.stringify(updated));
                return { progress: updated };
            }
            return state;
        }),
    completeChapter: (chapterId) =>
        set((state) => {
            if (state.progress && !state.progress.completedChapters.includes(chapterId)) {
                const updated = {
                    ...state.progress,
                    completedChapters: [...state.progress.completedChapters, chapterId],
                };
                setItem("progress", JSON.stringify(updated));
                return { progress: updated };
            }
            return state;
        }),
    completeLesson: (lessonId) =>
        set((state) => {
            if (state.progress && !state.progress.completedLessons.includes(lessonId)) {
                const updated = {
                    ...state.progress,
                    completedLessons: [...state.progress.completedLessons, lessonId],
                };
                setItem("progress", JSON.stringify(updated));
                return { progress: updated };
            }
            return state;
        }),
    completeQuiz: (quizId) =>
        set((state) => {
            if (state.progress && !state.progress.completedQuizzes.includes(quizId)) {
                const updated = {
                    ...state.progress,
                    completedQuizzes: [...state.progress.completedQuizzes, quizId],
                };
                setItem("progress", JSON.stringify(updated));
                return { progress: updated };
            }
            return state;
        }),
    updateStreak: (streak) =>
        set((state) => {
            if (state.progress) {
                const updated = { ...state.progress, streak, lastActiveDate: new Date().toISOString() };
                setItem("progress", JSON.stringify(updated));
                return { progress: updated };
            }
            return state;
        }),
    updateOverallProgress: (percentage) =>
        set((state) => {
            if (state.progress) {
                const updated = { ...state.progress, overallProgress: percentage };
                setItem("progress", JSON.stringify(updated));
                return { progress: updated };
            }
            return state;
        }),
    calculateOverallProgress: async (allChapters, allQuizzes) => {
        const state = get();
        if (!state.progress) return 0;

        // Count total lessons across all chapters
        let totalLessons = 0;
        allChapters.forEach((chapter) => {
            if (chapter.content && Array.isArray(chapter.content)) {
                totalLessons += chapter.content.length;
            }
        });

        // Count total quizzes
        const totalQuizzes = allQuizzes.length;

        // Total items (lessons + quizzes)
        const totalItems = totalLessons + totalQuizzes;
        if (totalItems === 0) return 0;

        // Count completed items
        const completedLessons = state.progress.completedLessons?.length || 0;
        const completedQuizzes = state.progress.completedQuizzes?.length || 0;
        const completedItems = completedLessons + completedQuizzes;

        // Calculate percentage
        const percentage = Math.round((completedItems / totalItems) * 100);

        // Update progress
        if (state.progress) {
            const updated = { ...state.progress, overallProgress: percentage };
            setItem("progress", JSON.stringify(updated));
            set({ progress: updated });
        }

        return percentage;
    },
    loadProgress: async () => {
        try {
            const stored = await getItem("progress");
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure backward compatibility - add new fields if missing
                const progress: Progress = {
                    ...parsed,
                    completedLessons: parsed.completedLessons || [],
                    completedQuizzes: parsed.completedQuizzes || [],
                };
                set({ progress });
            }
        } catch (error) {
            console.error("Error loading progress:", error);
        }
    },
    clearProgress: async () => {
        set({ progress: null, chapterProgress: {} });
        await removeItem("progress");
    },
}));
