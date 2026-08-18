import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";

export default function TabsLayout() {
    const { user } = useUserStore();
    const isTeacher = user?.role === UserRole.TEACHER;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#F2B138",
                tabBarInactiveTintColor: "#666",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="learn"
                redirect={isTeacher}
                options={{
                    title: "Learn",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="classes"
                redirect={!isTeacher}
                options={{
                    title: "Classes",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="exams"
                redirect={isTeacher}
                options={{
                    title: "Exams",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="school" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                redirect={isTeacher}
                options={{
                    title: "Leaderboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="trophy" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
