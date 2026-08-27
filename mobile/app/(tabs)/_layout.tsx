import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";

const TEAL = "#1A5C6B";

function Badge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
    );
}

export default function TabsLayout() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        const fetchCount = async () => {
            try {
                const count = await apiClient.getUnreadNotificationCount();
                if (mounted) setUnreadCount(count);
            } catch { }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: TEAL,
                tabBarInactiveTintColor: "#999",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopColor: "#F0F0F0",
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
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
                        <View>
                            <Ionicons name="school" size={size} color={color} />
                            <Badge count={unreadCount} />
                        </View>
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

const styles = StyleSheet.create({
    badge: {
        position: "absolute",
        top: -4,
        right: -10,
        backgroundColor: "#EF4444",
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    badgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "700",
    },
});
