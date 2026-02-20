import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { StudentDetail, StudentStatus } from "@/lib/types";
import { LEVEL_INFO } from "@/lib/constants/levels";

export default function StudentDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadStudentDetail();
        }
    }, [id]);

    const loadStudentDetail = async () => {
        try {
            const data = await apiClient.getStudentDetail(id!);
            setStudent(data);
        } catch (error: unknown) {
            console.error("Student detail error:", error);
            Alert.alert("Error", (error as Error).message || "Failed to load student details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: StudentStatus): string => {
        switch (status) {
            case StudentStatus.ON_TRACK:
                return "#4CAF50";
            case StudentStatus.BEHIND:
                return "#FF9800";
            case StudentStatus.AT_RISK:
                return "#F44336";
            default:
                return "#9E9E9E";
        }
    };

    const getStatusLabel = (status: StudentStatus): string => {
        switch (status) {
            case StudentStatus.ON_TRACK:
                return "On Track";
            case StudentStatus.BEHIND:
                return "Behind";
            case StudentStatus.AT_RISK:
                return "At Risk";
            default:
                return "Unknown";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading student details...</Text>
            </View>
        );
    }

    if (!student) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Student not found</Text>
            </View>
        );
    }

    const statusColor = getStatusColor(student.status);
    const statusLabel = getStatusLabel(student.status);
    const levelInfo = student.level ? LEVEL_INFO[student.level] : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Student Details</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.card}>
                <View style={styles.studentInfo}>
                    <View style={styles.nameSection}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                    <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                {levelInfo && (
                    <View style={styles.levelBadge}>
                        <Text style={[styles.levelText, { color: levelInfo.color }]}>
                            {levelInfo.label} Level
                        </Text>
                    </View>
                )}

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="trophy" size={24} color="#F2B138" />
                        <Text style={styles.statValue}>{student.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        <Text style={styles.statValue}>{student.completedChapters.length}</Text>
                        <Text style={styles.statLabel}>Chapters</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="trending-up" size={24} color="#2196F3" />
                        <Text style={styles.statValue}>{Math.round(student.overallProgress)}%</Text>
                        <Text style={styles.statLabel}>Progress</Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Overall Progress</Text>
                        <Text style={styles.progressValue}>
                            {Math.round(student.overallProgress)}%
                        </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBar,
                                {
                                    width: `${student.overallProgress}%`,
                                    backgroundColor: statusColor,
                                },
                            ]}
                        />
                    </View>
                </View>
            </View>

            {student.currentChapterTitle && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Current Chapter</Text>
                    <Text style={styles.chapterTitle}>{student.currentChapterTitle}</Text>
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Quiz Attempts</Text>
                {student.quizAttempts.length === 0 ? (
                    <Text style={styles.emptyText}>No quiz attempts yet</Text>
                ) : (
                    student.quizAttempts.map((attempt, index) => (
                        <View key={attempt.id} style={styles.attemptItem}>
                            <View style={styles.attemptHeader}>
                                <Text style={styles.attemptNumber}>Attempt {index + 1}</Text>
                                <View
                                    style={[
                                        styles.attemptBadge,
                                        {
                                            backgroundColor: attempt.passed
                                                ? "#E8F5E9"
                                                : "#FFEBEE",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.attemptBadgeText,
                                            {
                                                color: attempt.passed ? "#4CAF50" : "#F44336",
                                            },
                                        ]}
                                    >
                                        {attempt.passed ? "Passed" : "Failed"}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.attemptScore}>
                                Score: {attempt.score} ({attempt.percentage}%)
                            </Text>
                            <Text style={styles.attemptDate}>
                                {formatDate(attempt.completedAt)}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Activity</Text>
                <View style={styles.activityItem}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.activityText}>
                        Last active: {formatDate(student.lastActiveDate)}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    content: {
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorText: {
        fontSize: 16,
        color: "#F44336",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#282F2E",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 24,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    studentInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    nameSection: {
        flex: 1,
    },
    studentName: {
        fontSize: 24,
        fontWeight: "800",
        color: "#282F2E",
        marginBottom: 4,
    },
    studentEmail: {
        fontSize: 14,
        color: "#666",
    },
    statusBadge: {
        borderWidth: 2,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "700",
    },
    levelBadge: {
        alignSelf: "flex-start",
        marginBottom: 16,
    },
    levelText: {
        fontSize: 16,
        fontWeight: "700",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#282F2E",
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    progressContainer: {
        marginTop: 8,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    progressValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#282F2E",
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 16,
    },
    chapterTitle: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
    },
    attemptItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    attemptHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    attemptNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#282F2E",
    },
    attemptBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    attemptBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    attemptScore: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    attemptDate: {
        fontSize: 12,
        color: "#999",
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        fontStyle: "italic",
    },
    activityItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    activityText: {
        fontSize: 14,
        color: "#666",
    },
});
