import { Redirect } from "expo-router";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";

export default function HomeTab() {
    const { user } = useUserStore();

    if (user?.role === UserRole.TEACHER) {
        return <Redirect href="/(tabs)/classes" />;
    }

    return <Redirect href="/(tabs)/learn" />;
}
