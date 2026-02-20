import { create } from "zustand";
import { User, Level } from "@/lib/types";
import { setItem, getItem, removeItem } from "@/lib/utils/storage";

interface UserState {
    user: User | null;
    setUser: (user: User | null) => void;
    updateLevel: (level: Level) => void;
    loadUser: () => Promise<void>;
    clearUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => {
        set({ user });
        if (user) {
            setItem("user", JSON.stringify(user));
        }
    },
    updateLevel: (level) =>
        set((state) => {
            if (state.user) {
                const updatedUser = { ...state.user, level };
                setItem("user", JSON.stringify(updatedUser));
                return { user: updatedUser };
            }
            return state;
        }),
    loadUser: async () => {
        try {
            const stored = await getItem("user");
            if (stored) {
                set({ user: JSON.parse(stored) });
            }
        } catch (error) {
            console.error("Error loading user:", error);
        }
    },
    clearUser: async () => {
        set({ user: null });
        await removeItem("user");
    },
}));
