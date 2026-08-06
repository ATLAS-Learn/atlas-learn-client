<<<<<<< HEAD
import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api";
import ProgressBar from "@/components/progress/progress-bar";
=======
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/lib/store/user";
import { UserRole } from "@/lib/types";
import { useOverallProgress, useStreak, useUserQuizAttempts, useLearningPath } from "@/lib/hooks/api";
import { apiClient } from "@/lib/api";
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906

export default function HomeTab() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useUserStore();
<<<<<<< HEAD
    const { data: overallProgress, refetch, isRefetching } = useOverallProgress();
=======
    const { data: overallProgress } = useOverallProgress();
    const { data: streakData } = useStreak();
    const { data: quizAttempts = [] } = useUserQuizAttempts(user?.id);
    const { data: learningPath } = useLearningPath();
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906

    const isStudent = user?.role === UserRole.STUDENT;
    const displayName =
        user?.name || user?.email?.split("@")[0] || (user?.role === UserRole.TEACHER ? "Teacher" : "Student");

    const completion = Math.round(overallProgress?.overall?.completionPercentage ?? 0);
    const lessonsDone = overallProgress?.overall?.lessons?.completed ?? 0;
    const lessonsTotal = overallProgress?.overall?.lessons?.total ?? 0;
    const quizzesPassed = overallProgress?.overall?.quizzes?.passed ?? 0;
    const quizzesTotal = overallProgress?.overall?.quizzes?.total ?? 0;
<<<<<<< HEAD
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
=======
    const totalTimeSpent = overallProgress?.overall?.totalTimeSpent ?? 0;
    const streak = streakData?.streak ?? 0;

    const averageScore = useMemo(() => {
        if (!Array.isArray(quizAttempts) || quizAttempts.length === 0) return 0;
        const total = quizAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
        return Math.round(total / quizAttempts.length);
    }, [quizAttempts]);

    useFocusEffect(
        React.useCallback(() => {
            // Refetch progress data when tab is focused
            queryClient.invalidateQueries({ queryKey: ["progress"] });
            apiClient.getCurrentUser().then((freshUser) => {
                useUserStore.getState().setUser(freshUser);
            }).catch(() => {});
        }, [queryClient])
    );

    const formatTimeSpent = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.name}>{displayName}</Text>
                </View>
                {isStudent && streak > 0 && (
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakIcon}>{"\uD83D\uDD25"}</Text>
                        <Text style={styles.streakText}>{streak}</Text>
                    </View>
                )}
            </View>

            {/* Streak Banner (only when streak is 0) */}
            {isStudent && streak === 0 && (
                <View style={styles.streakBanner}>
                    <Text style={styles.streakBannerEmoji}>{"\uD83D\uDD25"}</Text>
                    <View style={styles.streakBannerInfo}>
                        <Text style={styles.streakBannerTitle}>Start your streak!</Text>
                        <Text style={styles.streakBannerText}>Complete a lesson or quiz today</Text>
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
                    </View>
                </View>
            )}

<<<<<<< HEAD
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
                )}
=======
            {/* Progress Ring + Stats */}
            {isStudent && (
                <View style={styles.progressCard}>
                    <View style={styles.progressRing}>
                        <Svg width={80} height={80} viewBox="0 0 80 80">
                            {/* Background circle */}
                            <Circle
                                cx={40}
                                cy={40}
                                r={34}
                                fill="none"
                                stroke="#F0F0F0"
                                strokeWidth={6}
                            />
                            {/* Progress circle */}
                            <Circle
                                cx={40}
                                cy={40}
                                r={34}
                                fill="none"
                                stroke="#1F2524"
                                strokeWidth={6}
                                strokeDasharray={`${2 * Math.PI * 34}`}
                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - completion / 100)}`}
                                strokeLinecap="round"
                                transform="rotate(-90 40 40)"
                            />
                        </Svg>
                        <View style={styles.progressTextContainer}>
                            <Text style={styles.progressPercent}>{completion}%</Text>
                            <Text style={styles.progressLabel}>complete</Text>
                        </View>
                    </View>
                    <View style={styles.progressStats}>
                        <View style={styles.progressStat}>
                            <Ionicons name="book-outline" size={16} color="#999" />
                            <Text style={styles.progressStatValue}>{lessonsDone}/{lessonsTotal}</Text>
                            <Text style={styles.progressStatLabel}>Lessons</Text>
                        </View>
                        <View style={styles.progressStatDivider} />
                        <View style={styles.progressStat}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#999" />
                            <Text style={styles.progressStatValue}>{quizzesPassed}/{quizzesTotal}</Text>
                            <Text style={styles.progressStatLabel}>Quizzes</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Quick Stats */}
            {isStudent && (
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={18} color="#999" />
                        <Text style={styles.statValue}>{formatTimeSpent(totalTimeSpent)}</Text>
                        <Text style={styles.statLabel}>Time Spent</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trophy-outline" size={18} color="#999" />
                        <Text style={styles.statValue}>{averageScore}%</Text>
                        <Text style={styles.statLabel}>Avg Score</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="ribbon-outline" size={18} color="#999" />
                        <Text style={styles.statValue}>{quizzesPassed}</Text>
                        <Text style={styles.statLabel}>Passed</Text>
                    </View>
                </View>
            )}

            {/* Continue Your Path */}
            {isStudent && learningPath && learningPath.perSubject.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Continue Learning</Text>
                    {learningPath.perSubject.map((subject) => {
                        const next = subject.currentChapter || subject.nextRecommended || subject.startChapter;
                        if (!next) return null;
                        return (
                            <TouchableOpacity
                                key={subject.subjectId}
                                style={styles.pathCard}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(tabs)/learn/[id]",
                                        params: {
                                            id: next.id,
                                            subjectId: subject.subjectId,
                                        },
                                    } as any)
                                }
                                activeOpacity={0.7}
                            >
                                <View style={styles.pathLeft}>
                                    <View style={styles.pathDot} />
                                    <View>
                                        <Text style={styles.pathSubject}>{subject.subjectName}</Text>
                                        <Text style={styles.pathChapter}>{next.title}</Text>
                                    </View>
                                </View>
                                <View style={styles.pathRight}>
                                    <Text style={styles.pathPercent}>{subject.completionPercentage}%</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#CCC" />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    {learningPath.studyPlan && (
                        <Text style={styles.studyPlan}>{learningPath.studyPlan}</Text>
                    )}
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    {isStudent ? (
                        <>
                            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/learn")} activeOpacity={0.7}>
                                <Ionicons name="book-outline" size={20} color="#1F2524" />
                                <Text style={styles.actionTitle}>Learn</Text>
                                <Text style={styles.actionDesc}>Continue lessons</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
                                <Ionicons name="person-outline" size={20} color="#1F2524" />
                                <Text style={styles.actionTitle}>Profile</Text>
                                <Text style={styles.actionDesc}>View progress</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCard} onPress={() => router.push({ pathname: "/(tabs)/profile", params: { openFeedback: "true" } } as any)} activeOpacity={0.7}>
                                <Ionicons name="chatbubble-outline" size={20} color="#1F2524" />
                                <Text style={styles.actionTitle}>Feedback</Text>
                                <Text style={styles.actionDesc}>Send feedback</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate("/(tabs)/classes")} activeOpacity={0.7}>
                                <Ionicons name="people-outline" size={20} color="#1F2524" />
                                <Text style={styles.actionTitle}>Classes</Text>
                                <Text style={styles.actionDesc}>View students</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
                                <Ionicons name="settings-outline" size={20} color="#1F2524" />
                                <Text style={styles.actionTitle}>Settings</Text>
                                <Text style={styles.actionDesc}>Manage account</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    content: { padding: 20, paddingBottom: 40 },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        marginTop: 8,
    },
    greeting: { fontSize: 15, color: "#999", fontWeight: "500" },
    name: { fontSize: 26, fontWeight: "800", color: "#1F2524", marginTop: 2 },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    streakIcon: { fontSize: 16 },
    streakText: { fontSize: 14, fontWeight: "700", color: "#E65100" },

    // Streak Banner
    streakBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    streakBannerEmoji: { fontSize: 28, marginRight: 12 },
    streakBannerInfo: { flex: 1 },
    streakBannerTitle: { fontSize: 14, fontWeight: "700", color: "#E65100" },
    streakBannerText: { fontSize: 12, color: "#BF360C", marginTop: 2 },

    // Progress Card
    progressCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    progressRing: {
        width: 80,
        height: 80,
        marginRight: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    progressTextContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    progressPercent: { fontSize: 20, fontWeight: "800", color: "#1F2524" },
    progressLabel: { fontSize: 10, color: "#999", marginTop: -2 },
    progressStats: { flex: 1, flexDirection: "row", alignItems: "center" },
    progressStat: { flex: 1, alignItems: "center" },
    progressStatValue: { fontSize: 16, fontWeight: "700", color: "#1F2524", marginTop: 4 },
    progressStatLabel: { fontSize: 11, color: "#999", marginTop: 2 },
    progressStatDivider: { width: 1, height: 30, backgroundColor: "#F0F0F0" },

    // Stats Row
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
    },
    statValue: { fontSize: 15, fontWeight: "700", color: "#1F2524", marginTop: 6 },
    statLabel: { fontSize: 10, color: "#999", marginTop: 2, fontWeight: "500" },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1F2524", marginBottom: 12 },

    // Learning Path
    pathCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    pathLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
    pathDot: { width: 4, height: 32, borderRadius: 2, backgroundColor: "#1F2524" },
    pathSubject: { fontSize: 11, color: "#999", fontWeight: "600" },
    pathChapter: { fontSize: 14, fontWeight: "600", color: "#1F2524", marginTop: 2 },
    pathRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    pathPercent: { fontSize: 12, fontWeight: "700", color: "#999" },
    studyPlan: { fontSize: 12, color: "#999", fontStyle: "italic", marginTop: 4 },

    // Actions
    actionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    actionCard: {
        flex: 1,
        minWidth: 100,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
    },
    actionTitle: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#1F2524" },
    actionDesc: { marginTop: 4, fontSize: 11, color: "#999" },
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
});
