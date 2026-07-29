import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useUserStore } from "@/lib/store/user";
import { UserRole, SubjectProgress } from "@/lib/types";
import { useOverallProgress, useStreak, useUserQuizAttempts, useLearningPath } from "@/lib/hooks/api";
import { apiClient } from "@/lib/api";

function SubjectProgressCard({ subject }: { subject: SubjectProgress }) {
    const router = useRouter();
    const chapters = subject.chapters as unknown as { total: number; completed: number };
    const lessons = subject.lessons as unknown as { total: number; completed: number };

    return (
        <TouchableOpacity
            style={styles.subjectCard}
            onPress={() =>
                router.push({
                    pathname: "/(tabs)/learn/subjects/[subjectId]",
                    params: { subjectId: subject.subjectId, subjectCode: subject.code },
                } as any)
            }
        >
            <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <View style={styles.subjectMetaRow}>
                    <Text style={styles.subjectMeta}>
                        {chapters.completed}/{chapters.total} chapters
                    </Text>
                    <Text style={styles.subjectMetaDot}>{" "}</Text>
                    <Text style={styles.subjectMeta}>
                        {lessons.completed}/{lessons.total} lessons
                    </Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${Math.min(subject.completionPercentage, 100)}%` },
                        ]}
                    />
                </View>
                <Text style={styles.progressPercent}>{subject.completionPercentage}% complete</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
    );
}

export default function HomeTab() {
    const router = useRouter();
    const { user } = useUserStore();
    const { data: overallProgress } = useOverallProgress();
    const { data: streakData } = useStreak();
    const { data: quizAttempts = [] } = useUserQuizAttempts(user?.id);
    const { data: learningPath } = useLearningPath();

    const isStudent = user?.role === UserRole.STUDENT;
    const displayName =
        user?.name || user?.email?.split("@")[0] || (user?.role === UserRole.TEACHER ? "Teacher" : "Student");

    const completion = Math.round(overallProgress?.overall?.completionPercentage ?? 0);
    const lessonsDone = overallProgress?.overall?.lessons?.completed ?? 0;
    const lessonsTotal = overallProgress?.overall?.lessons?.total ?? 0;
    const quizzesPassed = overallProgress?.overall?.quizzes?.passed ?? 0;
    const quizzesTotal = overallProgress?.overall?.quizzes?.total ?? 0;
    const totalTimeSpent = overallProgress?.overall?.totalTimeSpent ?? 0;
    const streak = streakData?.streak ?? 0;

    const averageScore = useMemo(() => {
        if (!Array.isArray(quizAttempts) || quizAttempts.length === 0) return 0;
        const total = quizAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
        return Math.round(total / quizAttempts.length);
    }, [quizAttempts]);

    // Refresh user data when screen gains focus (e.g. after adding subjects)
    useFocusEffect(
        React.useCallback(() => {
            apiClient.getCurrentUser().then((freshUser) => {
                useUserStore.getState().setUser(freshUser);
            }).catch(() => {});
        }, [])
    );

    const formatTimeSpent = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const subjects = useMemo(() => {
        const all = overallProgress?.subjects || [];
        const preferred = user?.preferredSubjects;
        if (!preferred || preferred.length === 0) return all;
        return all.filter((s) => preferred.includes(s.subjectId));
    }, [overallProgress, user?.preferredSubjects]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <Text style={styles.welcome}>Welcome back,</Text>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.subtle}>
                    {isStudent ? "Keep learning and track your progress." : "Manage your classes and track learners."}
                </Text>
            </View>

            {/* Streak Banner */}
            {isStudent && streak > 0 && (
                <View style={styles.streakBanner}>
                    <Text style={styles.streakEmoji}>{"\uD83D\uDD25"}</Text>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakValue}>{streak} day streak</Text>
                        <Text style={styles.streakLabel}>Keep it going!</Text>
                    </View>
                </View>
            )}

            {/* Continue Your Path */}
            {isStudent && learningPath && learningPath.perSubject.length > 0 && (
                <View style={styles.pathContainer}>
                    <Text style={styles.sectionTitle}>Continue Your Path</Text>
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
                                            params: { id: next.id, subjectId: subject.subjectId },
                                        } as any)
                                }
                            >
                                <View style={styles.pathCardLeft}>
                                    <Ionicons name="rocket-outline" size={20} color="#F2B138" />
                                    <View style={styles.pathCardInfo}>
                                        <Text style={styles.pathSubject}>{subject.subjectName}</Text>
                                        <Text style={styles.pathChapter}>{next.title}</Text>
                                    </View>
                                </View>
                                <View style={styles.pathCardRight}>
                                    <Text style={styles.pathProgress}>{subject.completionPercentage}%</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#999" />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    {learningPath.studyPlan && (
                        <Text style={styles.studyPlan}>{learningPath.studyPlan}</Text>
                    )}
                </View>
            )}

            {/* Progress Snapshot */}
            <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Progress Snapshot</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{completion}%</Text>
                        <Text style={styles.summaryLabel}>Overall</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {lessonsDone}/{lessonsTotal}
                        </Text>
                        <Text style={styles.summaryLabel}>Lessons</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {quizzesPassed}/{quizzesTotal}
                        </Text>
                        <Text style={styles.summaryLabel}>Quizzes</Text>
                    </View>
                </View>
            </View>

            {/* Stats Row for Students */}
            {isStudent && (
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={20} color="#F2B138" />
                        <Text style={styles.statValue}>{formatTimeSpent(totalTimeSpent)}</Text>
                        <Text style={styles.statLabel}>Time Spent</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trophy-outline" size={20} color="#F2B138" />
                        <Text style={styles.statValue}>{averageScore}%</Text>
                        <Text style={styles.statLabel}>Avg Quiz Score</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#F2B138" />
                        <Text style={styles.statValue}>{quizzesPassed}</Text>
                        <Text style={styles.statLabel}>Quizzes Passed</Text>
                    </View>
                </View>
            )}

            {/* Subject Progress */}
            {isStudent && subjects.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Your Subjects</Text>
                    {subjects.slice(0, 3).map((subject) => (
                        <SubjectProgressCard key={subject.subjectId} subject={subject} />
                    ))}
                    {subjects.length > 3 && (
                        <TouchableOpacity
                            style={styles.browseAllButton}
                            onPress={() => router.push("/(tabs)/learn/browse-subjects")}
                        >
                            <Text style={styles.browseAllText}>View all {subjects.length} subjects</Text>
                            <Ionicons name="arrow-forward" size={14} color="#F2B138" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.addSubjectButton}
                        onPress={() => router.push("/(tabs)/learn/browse-subjects")}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#F2B138" />
                        <Text style={styles.addSubjectText}>Browse All Subjects</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                {isStudent ? (
                    <>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/learn")}>
                            <Ionicons name="book" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>Continue Learning</Text>
                            <Text style={styles.actionText}>Jump back into lessons</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/profile")}>
                            <Ionicons name="person" size={22} color="#F2B138" />
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionText}>Update your info</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate("/(tabs)/classes")}>
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
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#282F2E", marginBottom: 12, marginTop: 8 },

    // Streak
    streakBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FFE0B2",
    },
    streakEmoji: { fontSize: 32, marginRight: 12 },
    streakInfo: { flex: 1 },
    streakValue: { fontSize: 18, fontWeight: "800", color: "#E65100" },
    streakLabel: { fontSize: 12, color: "#BF360C", marginTop: 2 },

    // Summary
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
        marginBottom: 16,
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
    summaryDivider: { width: 1, backgroundColor: "#F0F0F0" },

    // Stats Row
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    statValue: { fontSize: 16, fontWeight: "800", color: "#282F2E", marginTop: 6 },
    statLabel: { fontSize: 10, color: "#999", fontWeight: "600", marginTop: 2, textAlign: "center" },

    // Learning Path
    pathContainer: {
        marginBottom: 16,
    },
    pathCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 10,
    },
    pathCardLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    pathCardInfo: {
        flex: 1,
    },
    pathSubject: {
        fontSize: 12,
        color: "#999",
        fontWeight: "600",
    },
    pathChapter: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2524",
        marginTop: 2,
    },
    pathCardRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    pathProgress: {
        fontSize: 13,
        fontWeight: "700",
        color: "#F2B138",
    },
    studyPlan: {
        fontSize: 13,
        color: "#666",
        fontStyle: "italic",
        marginTop: 4,
    },

    // Subject Cards
    subjectCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 10,
    },
    subjectInfo: { flex: 1, marginRight: 12 },
    subjectName: { fontSize: 15, fontWeight: "700", color: "#1F2524" },
    subjectCode: { marginTop: 2, fontSize: 11, color: "#999", fontWeight: "700" },
    subjectMetaRow: { flexDirection: "row", marginTop: 6 },
    subjectMeta: { fontSize: 11, color: "#666" },
    subjectMetaDot: { fontSize: 11, color: "#666" },
    progressBarBg: {
        height: 5,
        backgroundColor: "#EEE",
        borderRadius: 3,
        marginTop: 8,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#F2B138",
        borderRadius: 3,
    },
    progressPercent: { marginTop: 4, fontSize: 11, color: "#999", fontWeight: "600" },
    viewAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        marginBottom: 8,
    },
    viewAllText: { fontSize: 13, fontWeight: "700", color: "#F2B138" },
    browseAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        backgroundColor: "#FFF9E6",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FFE082",
        marginTop: 4,
    },
    browseAllText: { fontSize: 13, fontWeight: "700", color: "#F2B138" },
    addSubjectButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        backgroundColor: "#FFF9E6",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FFE082",
        marginTop: 4,
    },
    addSubjectText: { fontSize: 14, fontWeight: "700", color: "#F2B138" },

    // Actions
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
