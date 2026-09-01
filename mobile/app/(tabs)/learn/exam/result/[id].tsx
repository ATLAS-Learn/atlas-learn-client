import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { getCacheSync, setCache } from "@/lib/utils/cache";
import ScreenHeader from "@/components/ui/screen-header";

const RESULT_CACHE_TTL = 30 * 1000;

export default function ExamResultScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const examId = Array.isArray(id) ? id[0] : id;

    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadResult = useCallback(async () => {
        if (!examId) return;
        const cacheKey = `cache:exam-result:${examId}`;

        const cached = getCacheSync<any>(cacheKey);
        if (cached) {
            setResult(cached);
            setLoading(false);
        }

        try {
            const fresh = await apiClient.getExamResult(examId);
            if (fresh) {
                setCache(cacheKey, fresh, RESULT_CACHE_TTL).catch(() => {});
                setResult(fresh);
            }
        } catch {} finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [examId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const fresh = await apiClient.getExamResult(examId);
            if (fresh) {
                setCache(`cache:exam-result:${examId}`, fresh, RESULT_CACHE_TTL).catch(() => {});
                setResult(fresh);
            }
        } catch {} finally {
            setRefreshing(false);
        }
    }, [examId]);

    React.useEffect(() => {
        loadResult();
    }, [loadResult]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam Result" onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            </View>
        );
    }

    if (!result) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam Result" onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <Text style={{ color: "#999" }}>No result found</Text>
                    <TouchableOpacity
                        onPress={() => router.replace("/(tabs)/learn/exam")}
                        style={{ marginTop: 16 }}
                    >
                        <Text style={{ color: "#F2B138", fontWeight: "600" }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const resultIsCorrected = result.isCorrected !== false;
    const passed = resultIsCorrected && result.score >= 70;
    const correctCount = result.corrections?.filter((c: any) => c.isCorrect === true).length ?? 0;
    const totalQuestions = result.corrections?.length ?? 0;
    const structuralCount = result.corrections?.filter((c: any) => c.questionType === "STRUCTURAL").length ?? 0;
    const mcqCorrect = result.corrections?.filter((c: any) => c.questionType === "MCQ" && c.isCorrect === true).length ?? 0;
    const mcqTotal = result.corrections?.filter((c: any) => c.questionType === "MCQ").length ?? 0;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Exam Result" onBack={() => router.back()} />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F2B138" />}
            >
                {!resultIsCorrected ? (
                    <View style={[styles.scoreCard, styles.scoreCardPending]}>
                        <Ionicons name="time-outline" size={48} color="#F2B138" />
                        <Text style={[styles.scoreLabel, { color: "#F2B138" }]}>
                            Awaiting Review
                        </Text>
                        <Text style={{ fontSize: 14, color: "#666", marginTop: 4, textAlign: "center" }}>
                            Your exam has {structuralCount} essay question{structuralCount > 1 ? "s" : ""} that need teacher grading.
                        </Text>
                        {mcqTotal > 0 && (
                            <Text style={{ fontSize: 13, color: "#999", marginTop: 8 }}>
                                MCQ score so far: {mcqCorrect}/{mcqTotal} correct
                            </Text>
                        )}
                        <Text style={{ fontSize: 12, color: "#999", marginTop: 12, fontStyle: "italic" }}>
                            You will be notified once graded.
                        </Text>
                    </View>
                ) : (
                <View style={[styles.scoreCard, passed ? styles.scoreCardPass : styles.scoreCardFail]}>
                    <Ionicons
                        name={passed ? "checkmark-circle" : "close-circle"}
                        size={48}
                        color={passed ? "#22C55E" : "#EF4444"}
                    />
                    <Text style={styles.scoreLabel}>
                        {passed ? "Passed!" : "Not Passed"}
                    </Text>
                    <Text style={styles.scoreValue}>{result.score}%</Text>
                    {result.totalPoints > 0 && (
                        <Text style={styles.scoreDetail}>
                            {result.earnedPoints}/{result.totalPoints} points
                        </Text>
                    )}
                    <Text style={styles.scoreDetail}>
                        {correctCount} / {totalQuestions} correct
                    </Text>
                    {result.timeSpent > 0 && (
                        <Text style={styles.timeText}>
                            Time: {Math.round(result.timeSpent / 60)}m {result.timeSpent % 60}s
                        </Text>
                    )}
                    {result.teacherComment && (
                        <Text style={{ fontSize: 13, color: "#084A59", fontStyle: "italic", marginTop: 10 }}>
                            Teacher: {result.teacherComment}
                        </Text>
                    )}
                </View>
                )}

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>{result.exam?.title}</Text>
                    <Text style={styles.infoMeta}>{result.exam?.subject?.name}</Text>
                </View>

                <Text style={styles.sectionTitle}>Review Answers</Text>
                {result.corrections?.map((c: any, idx: number) => (
                    <View key={idx} style={styles.correctionCard}>
                        <View style={styles.correctionHeader}>
                            <Text style={styles.correctionLabel}>Q{idx + 1} · {c.points}pts</Text>
                            <View style={[styles.correctBadge, c.isCorrect === true ? styles.correctBadgePass : c.isCorrect === false ? styles.correctBadgeFail : styles.correctBadgePending]}>
                                <Text style={[styles.correctBadgeText, c.isCorrect === true ? styles.correctBadgeTextPass : c.isCorrect === false ? styles.correctBadgeTextFail : styles.correctBadgeTextPending]}>
                                    {c.isCorrect === true ? "Correct" : c.isCorrect === false ? "Incorrect" : "Pending"}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.correctionQuestion}>{c.questionText}</Text>
                        {c.questionType === 'STRUCTURAL' ? (
                            <View style={styles.structuralAnswer}>
                                <Text style={styles.structuralLabel}>Your answer:</Text>
                                <Text style={styles.structuralText}>{c.textAnswer || '(No answer provided)'}</Text>
                                {c.isCorrect === null && (
                                    <Text style={styles.pendingText}>Pending teacher review</Text>
                                )}
                                {c.teacherComment && (
                                    <Text style={styles.teacherComment}>Teacher: {c.teacherComment}</Text>
                                )}
                            </View>
                        ) : (
                        (c.options || []).map((opt: string, oi: number) => (
                            <View
                                key={oi}
                                style={[
                                    styles.correctionOption,
                                    oi === c.correctAnswerIndex && styles.correctOption,
                                    oi === c.studentAnswer && !c.isCorrect && styles.wrongOption,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.correctionOptionText,
                                        oi === c.correctAnswerIndex && styles.correctOptionText,
                                        oi === c.studentAnswer && !c.isCorrect && styles.wrongOptionText,
                                    ]}
                                >
                                    {String.fromCharCode(65 + oi)}. {opt}
                                    {oi === c.correctAnswerIndex ? " ✓" : ""}
                                    {oi === c.studentAnswer && !c.isCorrect ? " ✗" : ""}
                                </Text>
                            </View>
                        ))
                        )}
                        {c.explanation && (
                            <Text style={styles.explanation}>{c.explanation}</Text>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace("/(tabs)/learn/exam")}
                >
                    <Text style={styles.backButtonText}>Back to Learn</Text>
                </TouchableOpacity>
            </View>
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
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    scoreCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        marginBottom: 16,
    },
    scoreCardPending: {
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    scoreCardPass: {
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
    },
    scoreCardFail: {
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    scoreLabel: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1F2524",
        marginTop: 8,
    },
    scoreValue: {
        fontSize: 40,
        fontWeight: "800",
        color: "#1F2524",
        marginTop: 4,
    },
    scoreDetail: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        color: "#999",
        marginTop: 8,
    },
    infoCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2524",
    },
    infoMeta: {
        fontSize: 13,
        color: "#999",
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2524",
        marginBottom: 12,
    },
    correctionCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    correctionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    correctionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#999",
    },
    correctBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    correctBadgePass: {
        backgroundColor: "#DCFCE7",
    },
    correctBadgeFail: {
        backgroundColor: "#FEE2E2",
    },
    correctBadgePending: {
        backgroundColor: "#FEF3C7",
    },
    correctBadgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    correctBadgeTextPass: {
        color: "#16A34A",
    },
    correctBadgeTextFail: {
        color: "#DC2626",
    },
    correctBadgeTextPending: {
        color: "#D97706",
    },
    correctionQuestion: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2524",
        lineHeight: 20,
        marginBottom: 10,
    },
    correctionOption: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: "#F9FAFB",
    },
    correctOption: {
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
    },
    wrongOption: {
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    correctionOptionText: {
        fontSize: 13,
        color: "#666",
    },
    correctOptionText: {
        color: "#16A34A",
        fontWeight: "600",
    },
    wrongOptionText: {
        color: "#DC2626",
        fontWeight: "600",
    },
    explanation: {
        fontSize: 12,
        color: "#999",
        fontStyle: "italic",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#F5F5F5",
    },
    structuralAnswer: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 10,
        marginBottom: 4,
    },
    structuralLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#999",
        marginBottom: 4,
    },
    structuralText: {
        fontSize: 13,
        color: "#333",
        lineHeight: 18,
    },
    pendingText: {
        fontSize: 12,
        color: "#F2B138",
        fontWeight: "600",
        marginTop: 6,
    },
    teacherComment: {
        fontSize: 12,
        color: "#084A59",
        fontStyle: "italic",
        marginTop: 6,
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    backButton: {
        backgroundColor: "#1F2524",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFF",
    },
});
