import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { apiClient } from "@/lib/api";
import ScreenHeader from "@/components/ui/screen-header";

export default function ExamTakeScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const examId = Array.isArray(id) ? id[0] : id;

    const [exam, setExam] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadExam = useCallback(async () => {
        if (!examId) return;
        try {
            const data = await apiClient.getExam(examId);
            if (!data) {
                Alert.alert("Error", "Exam not found.");
                router.back();
                return;
            }
            if (data.userAttempt) {
                router.replace({
                    pathname: "/(tabs)/exams/result/[id]" as any,
                    params: { id: examId },
                });
                return;
            }
            setExam(data);
            setAnswers(new Array(data.questions?.length ?? 0).fill(-1));
            if (data.timeLimit) {
                setTimeLeft(data.timeLimit);
            }
        } catch {
            Alert.alert("Error", "Failed to load exam.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        loadExam();
    }, [loadExam]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [exam?.timeLimit]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const selectAnswer = (index: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = index;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const unanswered = answers.filter((a) => a === -1).length;
        if (unanswered > 0) {
            Alert.alert(
                "Incomplete Exam",
                `You have ${unanswered} unanswered question(s). Submit anyway?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Submit", onPress: doSubmit },
                ]
            );
        } else {
            doSubmit();
        }
    };

    const doSubmit = async () => {
        if (!examId) return;
        setSubmitting(true);
        try {
            const timeSpent = exam?.timeLimit
                ? exam.timeLimit - (timeLeft ?? 0)
                : 0;
            await apiClient.submitExam(examId, {
                answers,
                timeSpent,
            });
            router.replace({
                pathname: "/(tabs)/exams/result/[id]" as any,
                params: { id: examId },
            });
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to submit exam.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam" onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            </View>
        );
    }

    if (!exam || !exam.questions || exam.questions.length === 0) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam" onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <Text style={{ color: "#999" }}>No questions available</Text>
                </View>
            </View>
        );
    }

    const question = exam.questions[currentQuestion];
    const total = exam.questions.length;
    const answered = answers.filter((a) => a !== -1).length;

    return (
        <View style={styles.container}>
            <ScreenHeader title={exam.title} onBack={() => router.back()} />

            <View style={styles.topBar}>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                        {currentQuestion + 1} / {total}
                    </Text>
                    <Text style={styles.answeredText}>{answered} answered</Text>
                </View>
                {timeLeft !== null && (
                    <View
                        style={[
                            styles.timer,
                            timeLeft < 60 && styles.timerWarning,
                        ]}
                    >
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={timeLeft < 60 ? "#EF4444" : "#666"}
                        />
                        <Text
                            style={[
                                styles.timerText,
                                timeLeft < 60 && styles.timerTextWarning,
                            ]}
                        >
                            {formatTime(timeLeft)}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${((currentQuestion + 1) / total) * 100}%` },
                    ]}
                />
            </View>

            <ScrollView
                style={styles.questionContainer}
                contentContainerStyle={styles.questionContent}
            >
                <Text style={styles.questionLabel}>
                    Question {currentQuestion + 1}
                    {question.points ? ` · ${question.points} pt${question.points !== 1 ? "s" : ""}` : ""}
                </Text>
                <Text style={styles.questionText}>{question.questionText}</Text>

                {question.options.map((option: string, index: number) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.optionButton,
                            answers[currentQuestion] === index &&
                                styles.optionSelected,
                        ]}
                        onPress={() => selectAnswer(index)}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.optionLetter,
                                answers[currentQuestion] === index &&
                                    styles.optionLetterSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionLetterText,
                                    answers[currentQuestion] === index &&
                                        styles.optionLetterTextSelected,
                                ]}
                            >
                                {String.fromCharCode(65 + index)}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.optionText,
                                answers[currentQuestion] === index &&
                                    styles.optionTextSelected,
                            ]}
                        >
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.navBar}>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        currentQuestion === 0 && styles.navButtonDisabled,
                    ]}
                    onPress={() =>
                        setCurrentQuestion((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentQuestion === 0}
                >
                    <Ionicons name="chevron-back" size={20} color={currentQuestion === 0 ? "#CCC" : "#1F2524"} />
                    <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
                        Previous
                    </Text>
                </TouchableOpacity>

                {currentQuestion === total - 1 ? (
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Exam</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() =>
                            setCurrentQuestion((prev) =>
                                Math.min(total - 1, prev + 1)
                            )
                        }
                    >
                        <Text style={styles.navButtonText}>Next</Text>
                        <Ionicons name="chevron-forward" size={20} color="#1F2524" />
                    </TouchableOpacity>
                )}
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
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    progressInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    progressText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1F2524",
    },
    answeredText: {
        fontSize: 12,
        color: "#999",
    },
    timer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerWarning: {
        backgroundColor: "#FEE2E2",
    },
    timerText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    timerTextWarning: {
        color: "#EF4444",
    },
    progressBar: {
        height: 4,
        backgroundColor: "#F0F0F0",
        marginHorizontal: 16,
        borderRadius: 2,
    },
    progressFill: {
        height: 4,
        backgroundColor: "#F2B138",
        borderRadius: 2,
    },
    questionContainer: {
        flex: 1,
    },
    questionContent: {
        padding: 16,
    },
    questionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#999",
        marginBottom: 8,
    },
    questionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2524",
        lineHeight: 24,
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#F0F0F0",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    optionSelected: {
        borderColor: "#F2B138",
        backgroundColor: "#F2B13810",
    },
    optionLetter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    optionLetterSelected: {
        backgroundColor: "#F2B138",
    },
    optionLetterText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#666",
    },
    optionLetterTextSelected: {
        color: "#FFF",
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
    },
    optionTextSelected: {
        color: "#1F2524",
        fontWeight: "600",
    },
    navBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingBottom: 32,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    navButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#F5F5F5",
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2524",
    },
    navButtonTextDisabled: {
        color: "#CCC",
    },
    submitButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#1F2524",
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFF",
    },
});
