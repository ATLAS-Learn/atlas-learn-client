import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Level } from "@/lib/types";
import { createPersistStorage } from "./persist";

interface UserState {
    user: User | null;
    lastSyncedAt: number | null;
    setUser: (user: User | null, options?: { markSynced?: boolean }) => void;
    updateLevel: (level: Level) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            lastSyncedAt: null,
            setUser: (user, options) => {
                const shouldMarkSynced = options?.markSynced ?? true;
                const nextSyncedAt = user && shouldMarkSynced ? Date.now() : null;
                set({ user, lastSyncedAt: nextSyncedAt });
            },
            updateLevel: (level) =>
                set((state) => {
                    if (state.user) {
                        return { user: { ...state.user, level } };
                    }
                    return state;
                }),
            clearUser: () => set({ user: null, lastSyncedAt: null }),
        }),
        {
            name: "user",
            storage: createPersistStorage(),
            partialize: (state) => ({
                user: state.user,
                lastSyncedAt: state.lastSyncedAt,
            }),
        }
    )
);
