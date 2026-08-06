import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { AssessmentCorrection } from "@/lib/types";
import ScreenHeader from "@/components/ui/screen-header";

export default function AssessmentCorrectionsScreen() {
    const router = useRouter();
    const [corrections, setCorrections] = useState<AssessmentCorrection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCorrections = async () => {
            try {
                const result = await apiClient.getAssessmentResult();
                setCorrections(result.corrections || []);
            } catch (err: any) {
                setError(err.message || "Failed to load corrections.");
            } finally {
                setLoading(false);
            }
        };
        loadCorrections();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading corrections...</Text>
            </View>
        );
    }

    if (error || corrections.length === 0) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Corrections" />
                <View style={styles.errorContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#CCC" />
                    <Text style={styles.errorText}>{error || "No corrections available."}</Text>
                </View>
            </View>
        );
    }

    const correctCount = corrections.filter((c) => c.isCorrect).length;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Corrections" />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryText}>
                        {correctCount} / {corrections.length} Passed
                    </Text>
                </View>

                {corrections.map((correction) => (
                    <View key={correction.questionIndex} style={styles.correctionCard}>
                        <View style={styles.correctionHeader}>
                            <Text style={styles.questionNumber}>Question {correction.questionIndex + 1}</Text>
                            <Text style={styles.questionSubject}>{correction.subjectName}</Text>
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
    summaryText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
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
    questionSubject: {
        fontSize: 12,
        color: "#999",
        flex: 1,
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
