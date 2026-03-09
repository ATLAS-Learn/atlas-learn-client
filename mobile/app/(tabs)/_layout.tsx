import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";

export default function TabsLayout() {
    const { user } = useUserStore();
    const insets = useSafeAreaInsets();
    const isTeacher = user?.role === UserRole.TEACHER;
    const topOffset = 12 + Math.round(Math.max(0, insets.top * 0.4));

    return (
        <View style={[styles.tabShell, { paddingTop: topOffset }]}>
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
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    tabShell: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
});
