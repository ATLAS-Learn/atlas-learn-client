import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QuestionCard from "@/components/quizzes/question-card";
import QuizProgress from "@/components/quizzes/quiz-progress";
import { apiClient } from "@/lib/api";
import { Quiz } from "@/lib/types";

export default function QuizScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            loadQuiz();
        }
    }, [id]);

    const loadQuiz = async () => {
        try {
            const data = await apiClient.getChapterQuiz(id!);
            setQuiz(data);
        } catch {
            Alert.alert("Error", "Failed to load quiz. Please try again.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (answerIndex: number) => {
        if (!quiz) return;
        const currentQuestion = quiz.questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [currentQuestion.id]: answerIndex,
        });
    };

    const handleNext = () => {
        if (!quiz) return;
        if (currentQuestionIndex < quiz.questions.length - 1) {
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

    const handleSubmit = async () => {
        if (!quiz) return;

        const unansweredQuestions = quiz.questions.filter(
            (q) => answers[q.id] === undefined
        );

        if (unansweredQuestions.length > 0) {
            Alert.alert(
                "Incomplete Quiz",
                "Please answer all questions before submitting."
            );
            return;
        }

        setSubmitting(true);
        try {
            const submission = {
                answers: quiz.questions.map((q) => ({
                    questionId: q.id,
                    answerIndex: answers[q.id],
                })),
            };

            const result = await apiClient.submitQuiz(quiz.id, submission);

            router.push({
                pathname: `/(tabs)/learn/${id}/quiz-result`,
                params: {
                    score: result.score.toString(),
                    totalQuestions: result.totalQuestions.toString(),
                    percentage: result.percentage.toString(),
                    passed: result.passed.toString(),
                    pastPaperReference: result.pastPaperReference || "",
                    unlockedNextChapter: result.unlockedNextChapter.toString(),
                },
            });
        } catch {
            Alert.alert("Error", "Failed to submit quiz. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading quiz...</Text>
            </View>
        );
    }

    if (!quiz) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Quiz not found</Text>
            </View>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const isAnswered = answers[currentQuestion.id] !== undefined;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chapter Quiz</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <QuizProgress
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={quiz.questions.length}
                />

                <QuestionCard
                    question={currentQuestion}
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
