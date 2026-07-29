import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QuestionCard from "@/components/quizzes/question-card";
import QuizProgress from "@/components/quizzes/quiz-progress";
import { apiClient } from "@/lib/api";
import { setItem } from "@/lib/utils/storage";
import { AssessmentQuestion } from "@/lib/types";

export default function AssessmentScreen() {
    const router = useRouter();
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load assessment questions from the API
     * Handles errors gracefully and provides user-friendly error messages
     */
    const loadQuestions = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const data = await apiClient.startAssessment();
            setQuestions(data);
            setError(null);
        } catch (error: any) {
            console.error("Assessment load error:", error);
            const errorMessage = error?.message || "Failed to load assessment questions. Please try again.";
            const normalizedErrorMessage = errorMessage.toLowerCase();
            
            // Provide more user-friendly error messages for common scenarios
            let userMessage = errorMessage;
            if (
                normalizedErrorMessage.includes("already completed") ||
                normalizedErrorMessage.includes("already taken") ||
                normalizedErrorMessage.includes("completed this assessment") ||
                normalizedErrorMessage.includes("assessment completed")
            ) {
                try {
                    const status = await apiClient.getAssessmentStatus();
                    if (status?.completed) {
                        await setItem("assessmentComplete", "true");
                        Alert.alert("Assessment Completed", "You have already completed the assessment.");
                        router.replace("/(tabs)");
                        return;
                    }
                } catch {
                    // Continue to show friendly message below if status check fails.
                }
                userMessage = "You have already completed the assessment.";
            }

            if (normalizedErrorMessage.includes("no active assessment") || 
                normalizedErrorMessage.includes("not available")) {
                userMessage = "Assessment is not available at this time. Please contact support or try again later.";
            } else if (normalizedErrorMessage.includes("exactly 5 questions")) {
                userMessage =
                    "Assessment is temporarily misconfigured on the server (must contain exactly 5 questions). Please try again later or contact support.";
            }
            
            setError(userMessage);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const handleSelectAnswer = (answerIndex: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [currentQuestion.id]: answerIndex,
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    /**
     * Submit assessment answers
     * Validates all questions are answered before submission
     * Maps answers to API format and navigates to results screen
     */
    const handleSubmit = async () => {
        // Validate all questions are answered before submission
        const unansweredQuestions = questions.filter(
            (q) => answers[q.id] === undefined
        );

        if (unansweredQuestions.length > 0) {
            Alert.alert(
                "Incomplete Assessment",
                "Please answer all questions before submitting."
            );
            return;
        }

        setSubmitting(true);
        try {
            // Submit answers as array of indices in question order
            // API expects: { answers: [0, 1, 2, 0, 1] } - indices match question order
            const answerIndices = questions.map((q) => answers[q.id]);

            const result = await apiClient.submitAssessment(answerIndices);

            // Navigate to result screen with assessment results
            router.push({
                pathname: "/(onboarding)/assessment-result",
                params: {
                    score: result.score.toString(),
                    totalQuestions: result.totalQuestions.toString(),
                    level: result.level,
                    message: result.message,
                    subjectBreakdown: JSON.stringify(result.subjectBreakdown || []),
                    recommendedChapter: JSON.stringify(result.recommendedChapter || null),
                },
            });
        } catch {
            Alert.alert("Error", "Failed to submit assessment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading assessment...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Assessment</Text>
                    <View style={styles.backButton} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
                    <Text style={styles.errorTitle}>Assessment Unavailable</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <View style={styles.errorActions}>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadQuestions}
                        >
                            <Ionicons name="refresh" size={20} color="#F2B138" />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.backButtonError}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.backButtonErrorText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>No questions available</Text>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isAnswered = answers[currentQuestion.id] !== undefined;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assessment</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <QuizProgress
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                />

                {currentQuestion.subjectName && (
                    <View style={styles.subjectBadge}>
                        <Ionicons name="book-outline" size={14} color="#F2B138" />
                        <Text style={styles.subjectBadgeText}>{currentQuestion.subjectName}</Text>
                    </View>
                )}

                <QuestionCard
                    question={{
                        id: currentQuestion.id,
                        questionText: currentQuestion.question,
                        options: currentQuestion.options,
                        correctAnswerIndex: -1,
                        points: 1,
                        quizId: "",
                    }}
                    selectedAnswer={answers[currentQuestion.id] ?? null}
                    onSelectAnswer={handleSelectAnswer}
                />
            </ScrollView>

            <View style={styles.footer}>
                {currentQuestionIndex > 0 && (
                    <TouchableOpacity
                        style={styles.previousButton}
                        onPress={handlePrevious}
                    >
                        <Ionicons name="arrow-back" size={20} color="#F2B138" />
                        <Text style={styles.previousButtonText}>Previous</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        !isAnswered && styles.nextButtonDisabled,
                        submitting && styles.nextButtonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={!isAnswered || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.nextButtonText}>
                                {isLastQuestion ? "Submit" : "Next"}
                            </Text>
                            {!isLastQuestion && (
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            )}
                        </>
                    )}
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
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#FAFAFA",
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#282F2E",
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 24,
    },
    errorActions: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
        maxWidth: 300,
    },
    retryButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#FFF9E6",
        borderWidth: 2,
        borderColor: "#F2B138",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    retryButtonText: {
        color: "#F2B138",
        fontSize: 16,
        fontWeight: "600",
    },
    backButtonError: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    backButtonErrorText: {
        color: "#666",
        fontSize: 16,
        fontWeight: "600",
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
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
    },
    subjectBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FFF9E6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: "flex-start",
        marginBottom: 16,
    },
    subjectBadgeText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#E65100",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        gap: 12,
    },
    previousButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#F2B138",
    },
    previousButtonText: {
        color: "#F2B138",
        fontSize: 16,
        fontWeight: "600",
    },
    nextButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F2B138",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
