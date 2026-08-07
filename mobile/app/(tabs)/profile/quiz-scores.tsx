import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { useUserStore } from "@/lib/store/user";
import { useUserQuizAttempts } from "@/lib/hooks/api";
import QuizScoresChart from "@/components/charts/QuizScoresChart";
import ScreenHeader from "@/components/ui/screen-header";

function isBackendUserId(userId: string | undefined): userId is string {
    if (!userId) return false;
    return /^c[a-z0-9]{8,}$/i.test(userId);
}

export default function QuizScoresScreen() {
    const router = useRouter();
    const { user, setUser } = useUserStore();
    const { data: quizAttempts = [], isLoading, refetch, isRefetching } = useUserQuizAttempts(user?.id, {
        limit: 20,
        offset: 0,
    });

    React.useEffect(() => {
        if (isBackendUserId(user?.id)) {
            return;
        }

        let active = true;
        void (async () => {
            try {
                const freshUser = await apiClient.getCurrentUser();
                if (active) {
                    setUser(freshUser);
                }
            } catch {
                // Keep existing state if identity refresh fails.
            }
        })();

        return () => {
            active = false;
        };
    }, [user?.id, setUser]);

    const handleRefresh = () => {
        refetch();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTimeSpent = (timeSpent?: number) => {
        if (typeof timeSpent !== "number" || !Number.isFinite(timeSpent) || timeSpent <= 0) {
            return "Time not recorded";
        }
        const minutes = Math.max(1, Math.round(timeSpent / 60));
        return `${minutes} min`;
    };

    const sortedAttempts = [...quizAttempts].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading quiz scores...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Quiz Scores" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
            >
                {quizAttempts.length > 0 && <QuizScoresChart attempts={sortedAttempts} />}
                
                {quizAttempts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No quiz attempts yet</Text>
                        <Text style={styles.emptySubtext}>
                            Complete quizzes to see your scores here
                        </Text>
                    </View>
                ) : (
                    sortedAttempts.map((attempt, index) => {
                        const passed = attempt.passed;
                        const percentage = typeof attempt.percentage === "number" ? attempt.percentage : attempt.score;
                        const hasPassFail = typeof passed === "boolean";
                        const attemptTitle = index === 0 ? "Latest attempt" : `Attempt ${sortedAttempts.length - index}`;
                        const scoreOutOf = typeof attempt.answers?.length === "number" && attempt.answers.length > 0
                            ? `out of ${attempt.answers.length}`
                            : "points";

                        return (
                            <TouchableOpacity
                                key={attempt.id}
                                style={styles.scoreCard}
                                onPress={() => router.push(`/(tabs)/profile/quiz-corrections?attemptId=${attempt.id}`)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.scoreHeader}>
                                    <View style={styles.scoreInfo}>
                                        <Text style={styles.quizTitle}>
                                            {attemptTitle}
                                        </Text>
                                        {attempt.quiz?.chapter?.subject && (
                                            <Text style={styles.quizSubject}>
                                                {attempt.quiz.chapter.subject.name}
                                            </Text>
                                        )}
                                        <Text style={styles.quizDate}>
                                            {formatDate(attempt.completedAt)}
                                        </Text>
                                        <Text style={styles.quizMeta}>
                                            {formatShortDate(attempt.completedAt)} • {formatTimeSpent(attempt.timeSpent)}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            hasPassFail
                                                ? passed
                                                    ? styles.statusBadgePassed
                                                    : styles.statusBadgeFailed
                                                : styles.statusBadgeNeutral,
                                        ]}
                                    >
                                        <Ionicons
                                            name={
                                                hasPassFail
                                                    ? passed
                                                        ? "checkmark-circle"
                                                        : "close-circle"
                                                    : "time-outline"
                                            }
                                            size={16}
                                            color={
                                                hasPassFail
                                                    ? passed
                                                        ? "#4CAF50"
                                                        : "#F44336"
                                                    : "#084A59"
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.statusText,
                                                hasPassFail
                                                    ? passed
                                                        ? styles.statusTextPassed
                                                        : styles.statusTextFailed
                                                    : styles.statusTextNeutral,
                                            ]}
                                        >
                                            {hasPassFail ? (passed ? "Passed" : "Failed") : "Completed"}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                                </View>

                                <View style={styles.scoreDetails}>
                                    <View style={styles.scoreItem}>
                                        <Text style={styles.scoreLabel}>Score</Text>
                                        <Text style={styles.scoreValue}>
                                            {attempt.score} <Text style={styles.scoreValueMuted}>{scoreOutOf}</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.scoreItem}>
                                        <Text style={styles.scoreLabel}>Percentage</Text>
                                        <Text
                                            style={[
                                                styles.scorePercentage,
                                                hasPassFail
                                                    ? passed
                                                        ? styles.scorePercentagePassed
                                                        : styles.scorePercentageFailed
                                                    : styles.scorePercentageNeutral,
                                            ]}
                                        >
                                            {Math.round(percentage)}%
                                        </Text>
                                    </View>
                                </View>
                                </TouchableOpacity>
                            );
                        })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },
    scoreCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    scoreHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    scoreInfo: {
        flex: 1,
    },
    quizTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    quizSubject: {
        fontSize: 13,
        fontWeight: "600",
        color: "#F2B138",
        marginBottom: 2,
    },
    quizDate: {
        fontSize: 12,
        color: "#999",
    },
    quizMeta: {
        marginTop: 4,
        fontSize: 12,
        color: "#084A59",
        fontWeight: "500",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgePassed: {
        backgroundColor: "#E8F5E9",
    },
    statusBadgeFailed: {
        backgroundColor: "#FFEBEE",
    },
    statusBadgeNeutral: {
        backgroundColor: "#EEF6F3",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    statusTextPassed: {
        color: "#4CAF50",
    },
    statusTextFailed: {
        color: "#E57373",
    },
    statusTextNeutral: {
        color: "#084A59",
    },
    scoreDetails: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    scoreItem: {
        alignItems: "center",
    },
    scoreLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
    },
    scoreValueMuted: {
        fontSize: 12,
        fontWeight: "600",
        color: "#999",
    },
    scorePercentage: {
        fontSize: 18,
        fontWeight: "700",
    },
    scorePercentagePassed: {
        color: "#4CAF50",
    },
    scorePercentageFailed: {
        color: "#E57373",
    },
    scorePercentageNeutral: {
        color: "#084A59",
    },
});
