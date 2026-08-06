import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPersistStorage } from "./persist";

interface AssessmentCache {
  isCompleted: boolean;
  attemptId: string | null;
  completedAt: string | null;
}

interface AssessmentState {
  cache: AssessmentCache;
  setAssessmentStatus: (status: AssessmentCache) => void;
  clearAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      cache: { isCompleted: false, attemptId: null, completedAt: null },
      setAssessmentStatus: (status) => set({ cache: status }),
      clearAssessment: () =>
        set({ cache: { isCompleted: false, attemptId: null, completedAt: null } }),
    }),
    {
      name: "assessment-cache",
      storage: createPersistStorage(),
      partialize: (state) => ({ cache: state.cache }),
    }
  )
);
