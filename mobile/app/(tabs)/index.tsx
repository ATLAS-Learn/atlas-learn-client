import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api";
import ProgressBar from "@/components/progress/progress-bar";

export default function HomeTab() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useUserStore();
    const { data: overallProgress, refetch, isRefetching } = useOverallProgress();

    const isStudent = user?.role === UserRole.STUDENT;
    const displayName =
        user?.name || user?.email?.split("@")[0] || (user?.role === UserRole.TEACHER ? "Teacher" : "Student");

    const completion = Math.round(overallProgress?.overall?.completionPercentage ?? 0);
    const lessonsDone = overallProgress?.overall?.lessons?.completed ?? 0;
    const lessonsTotal = overallProgress?.overall?.lessons?.total ?? 0;
    const quizzesPassed = overallProgress?.overall?.quizzes?.passed ?? 0;
    const quizzesTotal = overallProgress?.overall?.quizzes?.total ?? 0;
    const normalizedCompletion = Math.max(0, Math.min(completion, 100));

    useFocusEffect(
        useCallback(() => {
            void refetch();
        }, [refetch])
    );

    const handleRefresh = useCallback(() => {
        void refetch();
    }, [refetch]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
        >
            <View style={styles.heroCard}>
                <View style={styles.heroGlowOne} />
                <View style={styles.heroGlowTwo} />
                <Text style={styles.welcome}>Home</Text>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.subtle}>
                    {user?.role === UserRole.TEACHER ? "Manage your classes and track learners." : "Keep learning and track your progress."}
                </Text>
                <View style={styles.heroPills}>
                    <View style={styles.heroPill}>
                        <Text style={styles.heroPillValue}>{completion}%</Text>
                        <Text style={styles.heroPillLabel}>overall</Text>
                    </View>
                    <View style={styles.heroPill}>
                        <Text style={styles.heroPillValue}>{lessonsDone}</Text>
                        <Text style={styles.heroPillLabel}>lessons done</Text>
                    </View>
                    <View style={styles.heroPill}>
                        <Text style={styles.heroPillValue}>{quizzesPassed}</Text>
                        <Text style={styles.heroPillLabel}>quizzes passed</Text>
                    </View>
                </View>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Progress Snapshot</Text>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>Today</Text>
                    </View>
                </View>
                <ProgressBar progress={normalizedCompletion} />
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
            )}

            <View style={styles.actionsHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Text style={styles.actionsHint}>Pick a lane and jump in.</Text>
            </View>
            <View style={styles.actionsGrid}>
                {user?.role === UserRole.TEACHER ? (
                    <>
                        <TouchableOpacity style={[styles.actionCard, styles.actionCardPrimary]} onPress={() => router.push("/(tabs)/classes")}>
                            <View style={[styles.actionIconWrap, styles.actionIconWarm]}>
                                <Ionicons name="people" size={22} color="#BF522A" />
                            </View>
                            <Text style={styles.actionTitle}>My Classes</Text>
                            <Text style={styles.actionText}>View students and progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionCard, styles.actionCardSecondary]} onPress={() => router.push("/(tabs)/profile")}>
                            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
                                <Ionicons name="settings" size={22} color="#084A59" />
                            </View>
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionText}>Manage your account</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={[styles.actionCard, styles.actionCardPrimary]} onPress={() => router.push("/(tabs)/learn")}>
                            <View style={[styles.actionIconWrap, styles.actionIconWarm]}>
                                <Ionicons name="book" size={22} color="#BF522A" />
                            </View>
                            <Text style={styles.actionTitle}>Continue Learning</Text>
                            <Text style={styles.actionText}>Jump back into lessons</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionCard, styles.actionCardSecondary]} onPress={() => router.push("/(tabs)/learn/subjects")}>
                            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
                                <Ionicons name="albums" size={22} color="#12A67C" />
                            </View>
                            <Text style={styles.actionTitle}>Browse Subjects</Text>
                            <Text style={styles.actionText}>Pick a new topic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionCard, styles.actionCardSecondary]} onPress={() => router.push("/(tabs)/profile")}>
                            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
                                <Ionicons name="person" size={22} color="#084A59" />
                            </View>
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionText}>Update your info</Text>
                        </TouchableOpacity>
                    </>
            </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F6F4EE" },
    content: { padding: 20, paddingBottom: 40 },
    heroCard: {
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#011C26",
        borderRadius: 28,
        padding: 22,
        marginBottom: 20,
    },
    heroGlowOne: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 999,
        backgroundColor: "#12A67C",
        opacity: 0.18,
        top: -60,
        right: -30,
    },
    heroGlowTwo: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 999,
        backgroundColor: "#BF522A",
        opacity: 0.2,
        bottom: -26,
        left: -12,
    },
    welcome: { fontSize: 12, color: "#F2B138", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
    name: { fontSize: 30, fontWeight: "900", color: "#FFF8EF", marginTop: 8 },
    subtle: { marginTop: 10, fontSize: 14, lineHeight: 20, color: "#D7E2DE", maxWidth: "88%" },
    heroPills: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
    heroPill: {
        minWidth: 92,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    heroPillValue: { fontSize: 18, fontWeight: "800", color: "#FFF8EF" },
    heroPillLabel: { marginTop: 2, fontSize: 12, color: "#CBD4CD" },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    sectionTitle: { fontSize: 22, fontWeight: "900", color: "#1F2524" },
    sectionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#E5F4EF",
    },
    sectionBadgeText: { fontSize: 11, fontWeight: "800", color: "#12A67C" },
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "#D7E2DE",
        marginBottom: 20,
    },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    summaryItem: { alignItems: "center", flex: 1 },
    summaryValue: { fontSize: 20, fontWeight: "900", color: "#282F2E" },
    summaryLabel: { marginTop: 4, fontSize: 12, color: "#084A59", fontWeight: "700" },
    actionsHeader: { marginBottom: 12 },
    actionsHint: { marginTop: 4, fontSize: 13, color: "#084A59" },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    actionCard: {
        flexGrow: 1,
        flexBasis: "48%",
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(31,37,36,0.06)",
    },
    actionCardPrimary: { backgroundColor: "#FFF7E1" },
    actionCardSecondary: { backgroundColor: "#EEF6F3" },
    actionIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    actionIconWarm: { backgroundColor: "rgba(191,82,42,0.12)" },
    actionIconSecondary: { backgroundColor: "rgba(8,74,89,0.12)" },
    actionTitle: { marginTop: 14, fontSize: 15, fontWeight: "800", color: "#1F2524" },
    actionText: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#084A59" },
});
