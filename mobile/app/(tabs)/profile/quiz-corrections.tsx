import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";

interface QuizCorrection {
    questionIndex: number;
    questionText: string;
    options: string[];
    userAnswer: number | null;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string | null;
    points: number;
}

interface QuizCorrectionsData {
    attemptId: string;
    quizTitle: string;
    chapterTitle: string;
    subjectName: string;
    score: number;
    corrections: QuizCorrection[];
}

export default function QuizCorrectionsScreen() {
    const router = useRouter();
    const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
    const [data, setData] = useState<QuizCorrectionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!attemptId) {
            setError("No attempt ID provided.");
            setLoading(false);
            return;
        }

        const loadCorrections = async () => {
            try {
                const result = await apiClient.getQuizAttemptCorrections(attemptId);
                setData(result);
            } catch (err: any) {
                setError(err.message || "Failed to load corrections.");
            } finally {
                setLoading(false);
            }
        };
        loadCorrections();
    }, [attemptId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading corrections...</Text>
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quiz Corrections</Text>
                    <View style={styles.backButton} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#CCC" />
                    <Text style={styles.errorText}>{error || "No corrections available."}</Text>
                </View>
            </View>
        );
    }

    const correctCount = data.corrections.filter((c) => c.isCorrect).length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quiz Corrections</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.quizTitle}>{data.quizTitle}</Text>
                    <Text style={styles.chapterTitle}>{data.chapterTitle}</Text>
                    <Text style={styles.subjectName}>{data.subjectName}</Text>
                    <Text style={styles.scoreText}>{data.score}% — {correctCount}/{data.corrections.length} correct</Text>
                </View>

                {data.corrections.map((correction) => (
                    <View key={correction.questionIndex} style={styles.correctionCard}>
                        <View style={styles.correctionHeader}>
                            <Text style={styles.questionNumber}>Question {correction.questionIndex + 1}</Text>
                            <View style={[styles.correctBadge, correction.isCorrect && styles.correctBadgePassed]}>
                                <Text style={[styles.correctBadgeText, correction.isCorrect && styles.correctBadgeTextPassed]}>
                                    {correction.isCorrect ? "Passed" : "Failed"}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.questionText}>{correction.questionText}</Text>
                        {correction.options.map((option: string, optIndex: number) => {
                            const isUserAnswer = correction.userAnswer === optIndex;
                            const isCorrectAnswer = correction.correctAnswer === optIndex;
                            const showRed = isUserAnswer && !correction.isCorrect;
                            const showGreen = isCorrectAnswer;

                            return (
                                <View
                                    key={optIndex}
                                    style={[
                                        styles.optionRow,
                                        showRed && styles.optionRowWrong,
                                        showGreen && styles.optionRowCorrect,
                                    ]}
                                >
                                    <View style={[
                                        styles.optionLetter,
                                        showRed && styles.optionLetterWrong,
                                        showGreen && styles.optionLetterCorrect,
                                    ]}>
                                        <Text style={[
                                            styles.optionLetterText,
                                            showRed && styles.optionLetterTextWrong,
                                            showGreen && styles.optionLetterTextCorrect,
                                        ]}>
                                            {String.fromCharCode(65 + optIndex)}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        showRed && styles.optionTextWrong,
                                        showGreen && styles.optionTextCorrect,
                                    ]}>
                                        {option}
                                    </Text>
                                    {isUserAnswer && !correction.isCorrect && (
                                        <Ionicons name="close-circle" size={18} color="#E57373" />
                                    )}
                                    {isCorrectAnswer && (
                                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                    )}
                                </View>
                            );
                        })}
                        {correction.explanation && (
                            <View style={styles.explanationContainer}>
                                <Ionicons name="bulb-outline" size={16} color="#F2B138" />
                                <Text style={styles.explanationText}>{correction.explanation}</Text>
                            </View>
                        )}
                    </View>
                ))}
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
        paddingTop: 20,
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
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 16,
    },
    content: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        alignItems: "center",
    },
    quizTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    chapterTitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 2,
    },
    subjectName: {
        fontSize: 12,
        color: "#999",
        marginBottom: 8,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2524",
    },
    correctionCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    correctionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: "700",
        color: "#282F2E",
    },
    correctBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: "#FFEBEE",
    },
    correctBadgePassed: {
        backgroundColor: "#E8F5E9",
    },
    correctBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#E57373",
    },
    correctBadgeTextPassed: {
        color: "#4CAF50",
    },
    questionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1F2524",
        marginBottom: 12,
        lineHeight: 22,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: "#FAFAFA",
    },
    optionRowWrong: {
        backgroundColor: "#FFEBEE",
    },
    optionRowCorrect: {
        backgroundColor: "#E8F5E9",
    },
    optionLetter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
    optionLetterWrong: {
        backgroundColor: "#E57373",
    },
    optionLetterCorrect: {
        backgroundColor: "#4CAF50",
    },
    optionLetterText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#666",
    },
    optionLetterTextWrong: {
        color: "#fff",
    },
    optionLetterTextCorrect: {
        color: "#fff",
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        color: "#333",
    },
    optionTextWrong: {
        color: "#E57373",
        fontWeight: "600",
    },
    optionTextCorrect: {
        color: "#2E7D32",
        fontWeight: "600",
    },
    explanationContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
        padding: 10,
        backgroundColor: "#FFF9E6",
        borderRadius: 8,
    },
    explanationText: {
        flex: 1,
        fontSize: 13,
        color: "#666",
        lineHeight: 20,
    },
});
