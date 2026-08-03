import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Progress, ChapterProgress } from "@/lib/types";
import { createPersistStorage } from "./persist";

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
    clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set) => ({
            progress: null,
            chapterProgress: {},
            setProgress: (progress) => set({ progress }),
            updateCurrentChapter: (chapterId) =>
                set((state) => {
                    if (state.progress) {
                        return { progress: { ...state.progress, currentChapterId: chapterId } };
                    }
                    return state;
                }),
            completeChapter: (chapterId) =>
                set((state) => {
                    if (state.progress && !state.progress.completedChapters.includes(chapterId)) {
                        return {
                            progress: {
                                ...state.progress,
                                completedChapters: [...state.progress.completedChapters, chapterId],
                            },
                        };
                    }
                    return state;
                }),
            completeLesson: (lessonId) =>
                set((state) => {
                    if (state.progress && !state.progress.completedLessons.includes(lessonId)) {
                        return {
                            progress: {
                                ...state.progress,
                                completedLessons: [...state.progress.completedLessons, lessonId],
                            },
                        };
                    }
                    return state;
                }),
            completeQuiz: (quizId) =>
                set((state) => {
                    if (state.progress && !state.progress.completedQuizzes.includes(quizId)) {
                        return {
                            progress: {
                                ...state.progress,
                                completedQuizzes: [...state.progress.completedQuizzes, quizId],
                            },
                        };
                    }
                    return state;
                }),
            updateStreak: (streak) =>
                set((state) => {
                    if (state.progress) {
                        return {
                            progress: {
                                ...state.progress,
                                streak,
                                lastActiveDate: new Date().toISOString(),
                            },
                        };
                    }
                    return state;
                }),
            updateOverallProgress: (percentage) =>
                set((state) => {
                    if (state.progress) {
                        return {
                            progress: { ...state.progress, overallProgress: percentage },
                        };
                    }
                    return state;
                }),
            clearProgress: () => set({ progress: null, chapterProgress: {} }),
        }),
        {
            name: "progress",
            storage: createPersistStorage(),
            partialize: (state) => ({
                progress: state.progress,
            }),
        }
    )
);
