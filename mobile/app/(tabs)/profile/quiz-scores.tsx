import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { QuizAttempt, Chapter, Quiz } from "@/lib/types";
import { useUserStore } from "@/lib/store/user";

export default function QuizScoresScreen() {
    const router = useRouter();
    const { user } = useUserStore();
    const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
    const [chapters, setChapters] = useState<Record<string, Chapter>>({});
    const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadQuizScores();
    }, []);

    const loadQuizScores = async () => {
        if (!user?.id) {
            Alert.alert("Error", "User data not available.");
            router.back();
            return;
        }

        try {
            // Load user's quiz attempts
            const attempts = await apiClient.getUserQuizAttempts(user.id);
            setQuizAttempts(attempts);

            // Load all chapters first
            const chaptersList = await apiClient.getChapters();
            const chaptersMap: Record<string, Chapter> = {};
            chaptersList.forEach((chapter) => {
                chaptersMap[chapter.id] = chapter;
            });

            // Try to get chapter info for each quiz attempt by fetching the quiz
            for (const attempt of attempts) {
                try {
                    const quiz = await apiClient.getQuiz(attempt.quizId);
                    if (quiz.chapterId && !chaptersMap[quiz.chapterId]) {
                        try {
                            const chapter = await apiClient.getChapter(quiz.chapterId);
                            chaptersMap[quiz.chapterId] = chapter;
                        } catch (error) {
                            // Chapter might not exist, continue
                        }
                    }
                } catch (error) {
                    // Quiz might not exist, continue
                }
            }
            setChapters(chaptersMap);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load quiz scores. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadQuizScores();
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

    const getChapterTitle = (quizId: string): string => {
        const quiz = quizzes[quizId];
        if (quiz?.chapterId && chapters[quiz.chapterId]) {
            return chapters[quiz.chapterId].title;
        }
        return `Quiz ${quizId.slice(0, 8)}`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading quiz scores...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quiz Scores</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {quizAttempts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No quiz attempts yet</Text>
                        <Text style={styles.emptySubtext}>
                            Complete quizzes to see your scores here
                        </Text>
                    </View>
                ) : (
                    quizAttempts.map((attempt) => {
                        const passed = attempt.passed;
                        const percentage = attempt.percentage;
                        const quiz = quizzes[attempt.quizId];
                        const totalQuestions = quiz?.questions?.length || 0;
                        const chapterTitle = getChapterTitle(attempt.quizId);

                        return (
                            <View key={attempt.id} style={styles.scoreCard}>
                                <View style={styles.scoreHeader}>
                                    <View style={styles.scoreInfo}>
                                        <Text style={styles.quizTitle}>
                                            {chapterTitle}
                                        </Text>
                                        <Text style={styles.quizDate}>
                                            {formatDate(attempt.completedAt)}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            passed ? styles.statusBadgePassed : styles.statusBadgeFailed,
                                        ]}
                                    >
                                        <Ionicons
                                            name={passed ? "checkmark-circle" : "close-circle"}
                                            size={16}
                                            color={passed ? "#4CAF50" : "#F44336"}
                                        />
                                        <Text
                                            style={[
                                                styles.statusText,
                                                passed ? styles.statusTextPassed : styles.statusTextFailed,
                                            ]}
                                        >
                                            {passed ? "Passed" : "Failed"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.scoreDetails}>
                                    <View style={styles.scoreItem}>
                                        <Text style={styles.scoreLabel}>Score</Text>
                                        <Text style={styles.scoreValue}>
                                            {totalQuestions > 0 ? `${attempt.score} / ${totalQuestions}` : attempt.score}
                                        </Text>
                                    </View>
                                    <View style={styles.scoreItem}>
                                        <Text style={styles.scoreLabel}>Percentage</Text>
                                        <Text
                                            style={[
                                                styles.scorePercentage,
                                                passed ? styles.scorePercentagePassed : styles.scorePercentageFailed,
                                            ]}
                                        >
                                            {Math.round(percentage)}%
                                        </Text>
                                    </View>
                                </View>
                            </View>
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
    quizDate: {
        fontSize: 12,
        color: "#999",
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
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    statusTextPassed: {
        color: "#4CAF50",
    },
    statusTextFailed: {
        color: "#F44336",
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
    scorePercentage: {
        fontSize: 18,
        fontWeight: "700",
    },
    scorePercentagePassed: {
        color: "#4CAF50",
    },
    scorePercentageFailed: {
        color: "#F44336",
    },
});
