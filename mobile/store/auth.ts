import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  setAuth: (token) => set({ isAuthenticated: !!token, token }),
  logout: () => set({ isAuthenticated: false, token: null }),
}));
