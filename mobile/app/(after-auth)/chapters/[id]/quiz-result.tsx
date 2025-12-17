import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QuizCelebration from "@/components/quiz/quiz-celebration";
import { useProgressStore } from "@/store/progress";

export default function QuizResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string; score: string; totalQuestions: string; percentage: string; passed: string; pastPaperReference?: string; unlockedNextChapter: string }>();
    const { updateOverallProgress } = useProgressStore();

    const score = parseInt(params.score) || 0;
    const totalQuestions = parseInt(params.totalQuestions) || 5;
    const percentage = parseFloat(params.percentage) || 0;
    const passed = params.passed === "true";
    const pastPaperReference = params.pastPaperReference;
    const unlockedNextChapter = params.unlockedNextChapter === "true";

    const handleContinue = () => {
        if (unlockedNextChapter) {
            // Refresh progress
            updateOverallProgress(percentage);
            router.replace("/(after-auth)/dashboard");
        } else {
            router.back();
        }
    };

    const handleReviewChapter = () => {
        if (params.id) {
            router.push(`/(after-auth)/chapters/${params.id}`);
        } else {
            router.back();
        }
    };

    const handleTryAgain = () => {
        if (params.id) {
            router.push(`/(after-auth)/chapters/${params.id}/quiz`);
        } else {
            router.back();
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {passed ? (
                <>
                    <QuizCelebration
                        score={score}
                        totalQuestions={totalQuestions}
                        pastPaperReference={pastPaperReference}
                    />

                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>
                            {unlockedNextChapter ? "Continue to Next Chapter" : "Back to Dashboard"}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={styles.failureContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="refresh" size={60} color="#F44336" />
                            </View>
                        </View>

                        <Text style={styles.failureTitle}>Let's Review That Again</Text>

                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreText}>
                                {score} / {totalQuestions}
                            </Text>
                            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
                        </View>

                        <View style={styles.messageContainer}>
                            <Text style={styles.messageText}>
                                Don't worry! You can reread the chapter or try a different quiz on this topic.
                            </Text>
                        </View>

                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.reviewButton}
                                onPress={handleReviewChapter}
                            >
                                <Ionicons name="book-outline" size={20} color="#F2B138" />
                                <Text style={styles.reviewButtonText}>Review Chapter</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.tryAgainButton}
                                onPress={handleTryAgain}
                            >
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.tryAgainButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    content: {
        flexGrow: 1,
        padding: 24,
    },
    failureContainer: {
        alignItems: "center",
        padding: 24,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFEBEE",
        justifyContent: "center",
        alignItems: "center",
    },
    failureTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#282F2E",
        marginBottom: 16,
        textAlign: "center",
    },
    scoreContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: "800",
        color: "#282F2E",
    },
    percentageText: {
        fontSize: 24,
        fontWeight: "600",
        color: "#666",
        marginTop: 4,
    },
    messageContainer: {
        backgroundColor: "#FFF3E0",
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        width: "100%",
    },
    messageText: {
        fontSize: 16,
        color: "#E65100",
        textAlign: "center",
        lineHeight: 24,
    },
    actionsContainer: {
        width: "100%",
        gap: 12,
    },
    reviewButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    reviewButtonText: {
        color: "#F2B138",
        fontSize: 16,
        fontWeight: "700",
    },
    tryAgainButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    tryAgainButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    continueButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 24,
    },
    continueButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});

