import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { UserRole } from "@/lib/types";
import { useUserStore } from "@/lib/store/user";

type RoleGuardOptions = {
    redirectTo?: string;
    denyMessage?: string;
    showAlert?: boolean;
};

export function useRoleGuard(
    allowedRoles: UserRole[],
    options: RoleGuardOptions = {}
): { canAccess: boolean; roleKnown: boolean } {
    const { user } = useUserStore();
    const router = useRouter();
    const alertedRef = useRef(false);

    const roleKnown = Boolean(user?.role);
    const canAccess = Boolean(user?.role && allowedRoles.includes(user.role));

    useEffect(() => {
        if (!roleKnown) return;
        if (canAccess) {
            alertedRef.current = false;
            return;
        }

        if (options.showAlert !== false && !alertedRef.current) {
            Alert.alert("Access Denied", options.denyMessage || "You do not have access to this page.");
            alertedRef.current = true;
        }

        router.replace((options.redirectTo || "/(tabs)/profile") as any);
    }, [canAccess, options.denyMessage, options.redirectTo, options.showAlert, roleKnown, router]);

    return { canAccess, roleKnown };
}
