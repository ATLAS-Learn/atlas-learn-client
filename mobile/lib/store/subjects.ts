import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPersistStorage } from "./persist";

interface SubjectsCache {
  subjects: any[];
  lastFetchedAt: number | null;
}

interface SubjectsState {
  cache: SubjectsCache;
  setSubjects: (subjects: any[]) => void;
  clearSubjects: () => void;
  isStale: (maxAgeMs?: number) => boolean;
}

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set, get) => ({
      cache: { subjects: [], lastFetchedAt: null },
      setSubjects: (subjects) =>
        set({ cache: { subjects, lastFetchedAt: Date.now() } }),
      clearSubjects: () =>
        set({ cache: { subjects: [], lastFetchedAt: null } }),
      isStale: (maxAgeMs = 1000 * 60 * 10) => {
        const { lastFetchedAt } = get().cache;
        if (!lastFetchedAt) return true;
        return Date.now() - lastFetchedAt > maxAgeMs;
      },
    }),
    {
      name: "subjects-cache",
      storage: createPersistStorage(),
      partialize: (state) => ({ cache: state.cache }),
    }
  )
);
