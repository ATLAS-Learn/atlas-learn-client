import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import ScreenHeader from "@/components/ui/screen-header";

export default function ExamResultScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const examId = Array.isArray(id) ? id[0] : id;

    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadResult = useCallback(async () => {
        if (!examId) return;
        try {
            const data = await apiClient.getExamResult(examId);
            setResult(data);
        } catch {
            // Result might not exist yet
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
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
                        onPress={() => router.back()}
                        style={{ marginTop: 16 }}
                    >
                        <Text style={{ color: "#F2B138", fontWeight: "600" }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const passed = result.score >= 70;
    const correctCount = result.corrections?.filter((c: any) => c.isCorrect).length ?? 0;
    const totalQuestions = result.corrections?.length ?? 0;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Exam Result" onBack={() => router.back()} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Score Card */}
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
                    <Text style={styles.scoreDetail}>
                        {correctCount} / {totalQuestions} correct
                    </Text>
                    {result.timeSpent > 0 && (
                        <Text style={styles.timeText}>
                            Time: {Math.round(result.timeSpent / 60)}m {result.timeSpent % 60}s
                        </Text>
                    )}
                </View>

                {/* Exam Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>{result.exam?.title}</Text>
                    <Text style={styles.infoMeta}>{result.exam?.subject?.name}</Text>
                </View>

                {/* Corrections */}
                <Text style={styles.sectionTitle}>Review Answers</Text>
                {result.corrections?.map((c: any, idx: number) => (
                    <View key={idx} style={styles.correctionCard}>
                        <View style={styles.correctionHeader}>
                            <Text style={styles.correctionLabel}>Q{idx + 1}</Text>
                            <View style={[styles.correctBadge, c.isCorrect ? styles.correctBadgePass : styles.correctBadgeFail]}>
                                <Text style={[styles.correctBadgeText, c.isCorrect ? styles.correctBadgeTextPass : styles.correctBadgeTextFail]}>
                                    {c.isCorrect ? "Correct" : "Incorrect"}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.correctionQuestion}>{c.questionText}</Text>
                        {c.options.map((opt: string, oi: number) => (
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
                        ))}
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
                    onPress={() => router.replace("/(tabs)/learn")}
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
