import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api";

export default function HomeTab() {
    const router = useRouter();
    const { user } = useUserStore();
    const { data: overallProgress } = useOverallProgress();

    const displayName =
        user?.name || user?.email?.split("@")[0] || (user?.role === UserRole.TEACHER ? "Teacher" : "Student");

    const completion = Math.round(overallProgress?.overall?.completionPercentage ?? 0);
    const lessonsDone = overallProgress?.overall?.lessons?.completed ?? 0;
    const lessonsTotal = overallProgress?.overall?.lessons?.total ?? 0;
    const quizzesPassed = overallProgress?.overall?.quizzes?.passed ?? 0;
    const quizzesTotal = overallProgress?.overall?.quizzes?.total ?? 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <Text style={styles.welcome}>Welcome back,</Text>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.subtle}>
                    {user?.role === UserRole.TEACHER ? "Manage your classes and track learners." : "Keep learning and track your progress."}
                </Text>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Progress Snapshot</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{completion}%</Text>
                        <Text style={styles.summaryLabel}>Overall</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {lessonsDone}/{lessonsTotal}
                        </Text>
                        <Text style={styles.summaryLabel}>Lessons</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {quizzesPassed}/{quizzesTotal}
                        </Text>
                        <Text style={styles.summaryLabel}>Quizzes</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                {user?.role === UserRole.TEACHER ? (
                    <>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/classes")}>
                            <Ionicons name="people" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>My Classes</Text>
                            <Text style={styles.actionText}>View students and progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/profile")}>
                            <Ionicons name="settings" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionText}>Manage your account</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/learn")}>
                            <Ionicons name="book" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>Continue Learning</Text>
                            <Text style={styles.actionText}>Jump back into lessons</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/learn/subjects")}>
                            <Ionicons name="albums" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>Browse Subjects</Text>
                            <Text style={styles.actionText}>Pick a new topic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/profile")}>
                            <Ionicons name="person" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionText}>Update your info</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    content: { padding: 24, paddingBottom: 40 },
    hero: { marginBottom: 20 },
    welcome: { fontSize: 16, color: "#666" },
    name: { fontSize: 28, fontWeight: "800", color: "#1F2524", marginTop: 4 },
    subtle: { marginTop: 8, fontSize: 13, color: "#777" },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#282F2E", marginBottom: 12 },
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    summaryItem: { alignItems: "center", flex: 1 },
    summaryValue: { fontSize: 18, fontWeight: "800", color: "#282F2E" },
    summaryLabel: { marginTop: 4, fontSize: 12, color: "#666", fontWeight: "600" },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    actionCard: {
        flexGrow: 1,
        flexBasis: "48%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    actionTitle: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#1F2524" },
    actionText: { marginTop: 4, fontSize: 12, color: "#777" },
});
