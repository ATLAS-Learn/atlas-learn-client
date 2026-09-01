import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    AppState,
    BackHandler,
    Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api";
import { setCache } from "@/lib/utils/cache";
import ScreenHeader from "@/components/ui/screen-header";

export default function ExamTakeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const examId = Array.isArray(id) ? id[0] : id;

    const [exam, setExam] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [examStarted, setExamStarted] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const submittedRef = useRef(false);

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

    // Show start confirmation after exam loads
    useEffect(() => {
        if (loading || !exam || examStarted || exam.userAttempt) return;
        Alert.alert(
            "Start Exam",
            `You are about to start "${exam.title}".\n\n` +
            `${exam.timeLimit ? `Time limit: ${Math.floor(exam.timeLimit / 60)} minutes\n` : ""}` +
            `${exam.questions?.length || 0} questions\n\n` +
            "Important:\n" +
            "- The timer starts immediately\n" +
            "- You cannot pause or retake this exam\n" +
            "- Leaving this screen will auto-submit your exam\n" +
            "- You cannot restart after submitting\n\n" +
            "Are you ready to begin?",
            [
                { text: "Cancel", style: "cancel", onPress: () => router.back() },
                { text: "Start Exam", onPress: () => setExamStarted(true) },
            ]
        );
    }, [loading, exam, examStarted]);

    // Start timer only after exam started
    useEffect(() => {
        if (!examStarted || !exam?.timeLimit) return;
        setTimeLeft(exam.timeLimit);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    doSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [examStarted, exam?.timeLimit]);

    // Auto-submit when app goes to background
    useEffect(() => {
        if (!examStarted) return;
        const sub = AppState.addEventListener("change", (state) => {
            if ((state === "background" || state === "inactive") && !submittedRef.current) {
                doSubmit();
            }
        });
        return () => sub.remove();
    }, [examStarted]);

    // Block hardware back button
    useEffect(() => {
        if (!examStarted) return;
        const handler = BackHandler.addEventListener("hardwareBackPress", () => {
            Alert.alert(
                "Leave Exam?",
                "Leaving will auto-submit your exam. You cannot retake it.",
                [
                    { text: "Stay", style: "cancel" },
                    { text: "Leave & Submit", style: "destructive", onPress: () => doSubmit() },
                ]
            );
            return true;
        });
        return () => handler.remove();
    }, [examStarted]);

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

    const updateTextAnswer = (questionId: string, text: string) => {
        setTextAnswers((prev) => ({ ...prev, [questionId]: text }));
    };

    const handleSubmit = async () => {
        if (submitting || submittedRef.current) return;
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
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            const timeSpent = exam?.timeLimit
                ? exam.timeLimit - (timeLeft ?? 0)
                : 0;
            const result = await apiClient.submitExam(examId, {
                answers,
                textAnswers,
                timeSpent,
            });
            router.replace({
                pathname: "/(tabs)/exams/result/[id]" as any,
                params: { id: examId },
            });
        } catch (err: any) {
            submittedRef.current = false;
            Alert.alert("Error", err.message || "Failed to submit exam.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam" onBack={() => router.back()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#084A59" />
                </View>
            </View>
        );
    }

    if (!examStarted) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam" onBack={() => router.back()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#084A59" />
                </View>
            </View>
        );
    }

    if (!exam || !exam.questions || exam.questions.length === 0) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Exam" onBack={() => router.back()} />
                <View style={styles.center}>
                    <Ionicons name="document-text-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyText}>No questions available</Text>
                </View>
            </View>
        );
    }

    const question = exam.questions[currentQuestion];
    const total = exam.questions.length;
    const answeredCount = exam.questions.reduce((count: number, q: any, i: number) => {
        if (q.questionType === "STRUCTURAL") {
            return count + (textAnswers[q.id]?.trim() ? 1 : 0);
        }
        return count + (answers[i] !== -1 ? 1 : 0);
    }, 0);
    const isStructural = question.questionType === "STRUCTURAL";
    const isLast = currentQuestion === total - 1;
    const progress = ((currentQuestion + 1) / total) * 100;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{exam.title}</Text>
                    <Text style={styles.headerSubtitle}>{answeredCount}/{total} answered</Text>
                </View>
                {timeLeft !== null && (
                    <View style={[styles.timerBadge, timeLeft < 60 && styles.timerBadgeWarning]}>
                        <Ionicons name="time" size={16} color="#FFF" />
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    </View>
                )}
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            {/* Question number pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={styles.pillContent}>
                {exam.questions.map((_: any, i: number) => {
                    const isCurrent = i === currentQuestion;
                    const isAnswered = exam.questions[i].questionType === "STRUCTURAL"
                        ? !!textAnswers[exam.questions[i].id]?.trim()
                        : answers[i] !== -1;
                    return (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.pill,
                                isCurrent && styles.pillCurrent,
                                isAnswered && !isCurrent && styles.pillAnswered,
                            ]}
                            onPress={() => setCurrentQuestion(i)}
                        >
                            <Text style={[
                                styles.pillText,
                                isCurrent && styles.pillTextCurrent,
                                isAnswered && !isCurrent && styles.pillTextAnswered,
                            ]}>
                                {i + 1}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Question content */}
            <ScrollView style={styles.questionScroll} contentContainerStyle={styles.questionContent}>
                <View style={styles.questionHeader}>
                    <View style={styles.questionBadge}>
                        <Text style={styles.questionBadgeText}>
                            Q{currentQuestion + 1}
                        </Text>
                    </View>
                    {question.points ? (
                        <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>{question.points} pt{question.points !== 1 ? "s" : ""}</Text>
                        </View>
                    ) : null}
                    {isStructural && (
                        <View style={styles.essayBadge}>
                            <Text style={styles.essayBadgeText}>ESSAY</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.questionText}>{question.questionText}</Text>

                {isStructural ? (
                    <View style={styles.essayContainer}>
                        <Text style={styles.essayHint}>Write your answer below:</Text>
                        <TextInput
                            style={styles.essayInput}
                            placeholder="Type your answer here..."
                            placeholderTextColor="#AAA"
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                            value={textAnswers[question.id] || ""}
                            onChangeText={(text) => updateTextAnswer(question.id, text)}
                        />
                        <Text style={{ fontSize: 11, color: "#999", marginTop: 6, textAlign: "right" }}>
                            {(textAnswers[question.id] || "").length} characters
                        </Text>
                    </View>
                ) : (
                    (question.options || []).map((option: string, index: number) => {
                        const isSelected = answers[currentQuestion] === index;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                onPress={() => selectAnswer(index)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                                    <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {option}
                                </Text>
                                {isSelected && <Ionicons name="checkmark-circle" size={22} color="#084A59" />}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Bottom nav */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.navBtn, currentQuestion === 0 && styles.navBtnDisabled]}
                    onPress={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
                    disabled={currentQuestion === 0}
                >
                    <Ionicons name="chevron-back" size={18} color={currentQuestion === 0 ? "#CCC" : "#084A59"} />
                    <Text style={[styles.navBtnText, currentQuestion === 0 && styles.navBtnTextDisabled]}>Prev</Text>
                </TouchableOpacity>

                {isLast ? (
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                                <Text style={styles.submitBtnText}>Submit Exam</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() => setCurrentQuestion((p) => Math.min(total - 1, p + 1))}
                    >
                        <Text style={styles.navBtnText}>Next</Text>
                        <Ionicons name="chevron-forward" size={18} color="#084A59" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    emptyText: { fontSize: 15, color: "#999", marginTop: 8 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    headerLeft: { flex: 1, marginRight: 12 },
    headerTitle: { fontSize: 16, fontWeight: "700", color: "#011C26" },
    headerSubtitle: { fontSize: 12, color: "#999", marginTop: 2 },
    timerBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#011C26",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timerBadgeWarning: { backgroundColor: "#DC2626" },
    timerText: { fontSize: 16, fontWeight: "800", color: "#FFF", fontVariant: ["tabular-nums"] },

    progressTrack: { height: 3, backgroundColor: "#E5E7EB" },
    progressFill: { height: 3, backgroundColor: "#F2B138" },

    pillRow: { backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#F0F0F0", flexGrow: 0, marginTop: 4 },
    pillContent: { paddingHorizontal: 12, gap: 6 },
    pill: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },
    pillCurrent: { backgroundColor: "#084A59" },
    pillAnswered: { backgroundColor: "#D1FAE5" },
    pillText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
    pillTextCurrent: { color: "#FFF" },
    pillTextAnswered: { color: "#065F46" },

    questionScroll: { flex: 1 },
    questionContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexGrow: 1 },

    questionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    questionBadge: {
        backgroundColor: "#084A59",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    questionBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
    pointsBadge: {
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    pointsText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
    essayBadge: {
        backgroundColor: "#EDE9FE",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    essayBadgeText: { fontSize: 11, fontWeight: "700", color: "#5B21B6" },

    questionText: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1F2937",
        lineHeight: 26,
        marginBottom: 10,
    },

    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    optionCardSelected: {
        borderColor: "#084A59",
        backgroundColor: "#F0F9FF",
    },
    optionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },
    optionCircleSelected: { backgroundColor: "#084A59" },
    optionLetter: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
    optionLetterSelected: { color: "#FFF" },
    optionText: { flex: 1, fontSize: 15, color: "#374151", lineHeight: 22 },
    optionTextSelected: { color: "#1F2937", fontWeight: "600" },

    essayContainer: { marginTop: 4 },
    essayHint: { fontSize: 13, color: "#6B7280", marginBottom: 8, fontWeight: "500" },
    essayInput: {
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#084A59",
        borderRadius: 14,
        padding: 16,
        fontSize: 15,
        color: "#1F2937",
        minHeight: 200,
        lineHeight: 24,
    },

    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 28,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    navBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontSize: 14, fontWeight: "600", color: "#084A59" },
    navBtnTextDisabled: { color: "#CCC" },
    submitBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#084A59",
    },
    submitBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
