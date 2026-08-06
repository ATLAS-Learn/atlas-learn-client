import React, { useCallback, useEffect, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import QuestionCard from "@/components/quizzes/question-card";
import QuizProgress from "@/components/quizzes/quiz-progress";
import { apiClient } from "@/lib/api";
import { Chapter, Quiz, QuizSubmission } from "@/lib/types";
import { enqueueQuizSubmission } from "@/lib/utils/syncQueue";
import ScreenHeader from "@/components/ui/screen-header";

export default function QuizScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
    const chapterId = Array.isArray(id) ? id[0] : id;
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadQuiz = useCallback(async () => {
        try {
            if (!chapterId) {
                throw new Error("Missing chapter ID");
            }
            const [quizData, chapterData] = await Promise.all([
                apiClient.getChapterQuiz(chapterId),
                apiClient.getChapter(chapterId),
            ]);
            setQuiz(quizData);
            setChapter(chapterData);
        } catch {
            Alert.alert("Error", "Failed to load quiz. Please try again.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [chapterId, router]);

    useEffect(() => {
        if (chapterId) {
            loadQuiz();
        } else {
            setLoading(false);
        }
    }, [chapterId, loadQuiz]);

    const handleSelectAnswer = (answerIndex: number) => {
        if (!quiz?.questions) return;
        const currentQuestion = quiz.questions[currentQuestionIndex];
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: answerIndex,
        }));
    };

    const handleNext = () => {
        if (!quiz?.questions) return;
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
        if (!quiz?.questions) return;
        if (!chapter) {
            Alert.alert("Error", "Quiz settings are still loading. Please try again.");
            return;
        }

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

        const submission: QuizSubmission = {
            answers: quiz.questions.map((q) => answers[q.id] as number),
        };

        try {
            // Wait for server to score the quiz
            const result = await apiClient.submitQuiz(quiz.id, submission);
            await queryClient.invalidateQueries({ queryKey: ["progress"] });

            // If passed, mark all lessons complete in background (don't block navigation)
            if (result.passed && subjectKey) {
                apiClient.getChapterLessons(chapterId!, true).then((lessons) => {
                    lessons.forEach((lesson) => {
                        apiClient.completeSubjectChapterLesson(subjectKey, chapterId!, lesson.id).catch(() => {});
                    });
                }).catch(() => {});
            }

            // Invalidate learning path so home page shows next chapter
            queryClient.invalidateQueries({ queryKey: ["recommendations", "learning-path"] });

            // Navigate with SERVER-computed results
            router.replace({
                pathname: "/(tabs)/learn/[id]/quiz-result",
                params: {
                    id: chapterId!,
                    quizId: quiz.id,
                    subjectId: subjectKey || "",
                    score: result.score.toString(),
                    correctAnswers: result.correctAnswers.toString(),
                    totalQuestions: result.totalQuestions.toString(),
                    passed: result.passed.toString(),
                    unlockedNextChapter: result.unlockedNextChapter ? "true" : "false",
                    nextChapterTitle: result.unlockedNextChapter?.title || "",
                    nextChapterId: result.unlockedNextChapter?.id || "",
                    attemptId: result.attemptId,
                },
            } as any);
        } catch (err) {
            // If network fails, enqueue and compute locally as fallback
            console.warn("Quiz submission failed, enqueueing for retry", err);
            await enqueueQuizSubmission(quiz.id, submission);

            // Compute local fallback
            let correct = 0;
            let earnedPoints = 0;
            let totalPoints = 0;
            for (const q of quiz.questions) {
                const ans = answers[q.id];
                const correctIdx = q.correctAnswerIndex;
                const points = typeof q.points === "number" ? q.points : 1;
                totalPoints += points;
                if (typeof correctIdx === "number" && typeof ans === "number" && ans === correctIdx) {
                    correct++;
                    earnedPoints += points;
                }
            }
            const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
            const passed = score >= (chapter.unlockThreshold || 70);

            router.replace({
                pathname: "/(tabs)/learn/[id]/quiz-result",
                params: {
                    id: chapterId!,
                    quizId: quiz.id,
                    subjectId: subjectKey || "",
                    score: score.toString(),
                    correctAnswers: correct.toString(),
                    totalQuestions: quiz.questions.length.toString(),
                    passed: passed.toString(),
                    unlockedNextChapter: "false",
                    nextChapterTitle: "",
                    nextChapterId: "",
                },
            } as any);
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

    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Chapter Quiz" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>No questions available</Text>
                </View>
            </View>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const isAnswered = answers[currentQuestion.id] !== undefined;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Chapter Quiz" />

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
                        (!isAnswered || submitting) && styles.nextButtonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={!isAnswered || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
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
        color: "#E57373",
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
