import { create } from "zustand";
import { Progress, ChapterProgress } from "@/services/types";
import { setItem, getItem, removeItem } from "@/utils/storage";

interface ProgressState {
    progress: Progress | null;
    chapterProgress: Record<string, ChapterProgress>;
    setProgress: (progress: Progress) => void;
    updateCurrentChapter: (chapterId: string) => void;
    completeChapter: (chapterId: string) => void;
    updateStreak: (streak: number) => void;
    updateOverallProgress: (percentage: number) => void;
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
    loadProgress: async () => {
        try {
            const stored = await getItem("progress");
            if (stored) {
                set({ progress: JSON.parse(stored) });
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

