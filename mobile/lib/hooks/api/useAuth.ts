import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { AuthResponse, User } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";

export function useSignup() {
    const queryClient = useQueryClient();
    const { setAuth } = useAuthStore();
    const { setUser } = useUserStore();

    return useMutation({
        mutationFn: (data: {
            name: string;
            email: string;
            password: string;
            image?: string;
            role?: string;
        }) => apiClient.signup(data),
        onSuccess: (data: AuthResponse) => {
            setAuth(data.token);
            setUser(data.user);
            apiClient.setToken(data.token);
            queryClient.setQueryData(["user"], data.user);
        },
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ["user"],
        queryFn: () => apiClient.getCurrentUser(),
        enabled: false, // Only fetch when explicitly called
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const { logout: logoutStore } = useAuthStore();
    const { setUser } = useUserStore();

    return useMutation({
        mutationFn: () => apiClient.signOut(),
        onSuccess: async () => {
            await logoutStore();
            setUser(null);
            apiClient.setToken(null);
            queryClient.clear();
        },
    });
}
