import { create } from "zustand";
import { User, Level } from "@/lib/types";
import { setItem, getItem, removeItem } from "@/lib/utils/storage";

const USER_STORAGE_KEY = "user";
const USER_SYNCED_AT_KEY = "userSyncedAt";

type SetUserOptions = {
    markSynced?: boolean;
};

interface UserState {
    user: User | null;
    lastSyncedAt: number | null;
    setUser: (user: User | null, options?: SetUserOptions) => void;
    updateLevel: (level: Level) => void;
    loadUser: () => Promise<void>;
    clearUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    lastSyncedAt: null,
    setUser: (user, options) => {
        const shouldMarkSynced = options?.markSynced ?? true;
        const nextSyncedAt = user && shouldMarkSynced ? Date.now() : null;

        set({ user, lastSyncedAt: nextSyncedAt });
        if (user) {
            setItem(USER_STORAGE_KEY, JSON.stringify(user));
            if (nextSyncedAt) {
                setItem(USER_SYNCED_AT_KEY, String(nextSyncedAt));
            } else {
                removeItem(USER_SYNCED_AT_KEY);
            }
        } else {
            removeItem(USER_STORAGE_KEY);
            removeItem(USER_SYNCED_AT_KEY);
        }
    },
    updateLevel: (level) =>
        set((state) => {
            if (state.user) {
                const updatedUser = { ...state.user, level };
                setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
                return { user: updatedUser };
            }
            return state;
        }),
    loadUser: async () => {
        try {
            const [storedUser, storedSyncedAt] = await Promise.all([
                getItem(USER_STORAGE_KEY),
                getItem(USER_SYNCED_AT_KEY),
            ]);
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;
            const parsedSyncedAt = storedSyncedAt ? Number(storedSyncedAt) : null;
            set({
                user: parsedUser,
                lastSyncedAt: Number.isFinite(parsedSyncedAt) ? parsedSyncedAt : null,
            });
        } catch (error) {
            console.error("Error loading user:", error);
        }
    },
    clearUser: async () => {
        set({ user: null, lastSyncedAt: null });
        await Promise.all([removeItem(USER_STORAGE_KEY), removeItem(USER_SYNCED_AT_KEY)]);
    },
}));
