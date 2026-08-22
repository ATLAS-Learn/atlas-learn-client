import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
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
                options={{
                    title: "Learn",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="exams"
                options={{
                    title: "Exams",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="school" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard"
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
