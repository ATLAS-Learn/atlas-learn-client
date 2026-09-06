import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QuizCelebration from "@/components/quizzes/quiz-celebration";
import ScreenHeader from "@/components/ui/screen-header";

export default function QuizResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string; score: string; correctAnswers: string; totalQuestions: string; passed: string; unlockedNextChapter: string; nextChapterTitle?: string; nextChapterId?: string; quizId?: string; subjectId?: string; attemptId?: string; hasStructural?: string; isCorrected?: string }>();

    const score = parseInt(params.score as string) || 0;
    const correctAnswers = parseInt(params.correctAnswers as string) || 0;
    const totalQuestions = parseInt(params.totalQuestions as string) || 0;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = params.passed === "true";
    const unlockedNextChapter = params.unlockedNextChapter === "true";
    const nextChapterTitle = params.nextChapterTitle as string | undefined;
    const nextChapterId = params.nextChapterId as string | undefined;
    const subjectId = params.subjectId as string | undefined;
    const attemptId = params.attemptId as string | undefined;
    const quizId = params.quizId as string | undefined;
    const hasStructural = params.hasStructural === "true";
    const isCorrected = params.isCorrected === "true";
    const isPending = hasStructural && !isCorrected;

    const handleContinue = () => {
        if (unlockedNextChapter && nextChapterId) {
            router.replace({
                pathname: "/(tabs)/learn/[id]",
                params: { id: nextChapterId, subjectId: subjectId || "" },
            } as any);
        } else if (subjectId) {
            router.replace({
                pathname: "/(tabs)/learn/subjects/[subjectId]",
                params: { subjectId },
            } as any);
        } else {
            router.replace("/(tabs)/learn");
        }
    };

    const handleReviewChapter = () => {
        if (params.id) {
            router.replace(`/(tabs)/learn/${params.id}`);
        } else {
            router.back();
        }
    };

    const handleTryAgain = () => {
        if (params.id) {
            router.replace(`/(tabs)/learn/${params.id}/quiz`);
        } else {
            router.back();
        }
    };

    const handleViewCorrections = () => {
        if (attemptId) {
            router.push({
                pathname: "/(tabs)/profile/quiz-corrections",
                params: { attemptId },
            } as any);
        } else if (quizId) {
            router.push({
                pathname: "/(tabs)/profile/quiz-corrections",
                params: { quizId },
            } as any);
        }
    };

    // Pending review state
    if (isPending) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Quiz Results" />
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.pendingContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.pendingIconCircle}>
                                <Ionicons name="time-outline" size={60} color="#F2B138" />
                            </View>
                        </View>

                        <Text style={styles.pendingTitle}>Awaiting Review</Text>

                        <Text style={styles.pendingSubtitle}>
                            Your quiz contains essay questions that need to be reviewed by your teacher.
                        </Text>

                        <View style={styles.pendingInfoCard}>
                            <View style={styles.pendingInfoRow}>
                                <Ionicons name="chatbubble-outline" size={20} color="#084A59" />
                                <Text style={styles.pendingInfoText}>
                                    Essay questions are pending teacher correction
                                </Text>
                            </View>
                            <View style={styles.pendingInfoRow}>
                                <Ionicons name="time-outline" size={20} color="#084A59" />
                                <Text style={styles.pendingInfoText}>
                                    You&apos;ll be notified once your quiz is graded
                                </Text>
                            </View>
                            <View style={styles.pendingInfoRow}>
                                <Ionicons name="lock-closed-outline" size={20} color="#084A59" />
                                <Text style={styles.pendingInfoText}>
                                    You cannot retake this quiz until it&apos;s graded
                                </Text>
                            </View>
                        </View>

                        <View style={styles.pendingScoreContainer}>
                            <Text style={styles.pendingScoreLabel}>MCQ Score (so far)</Text>
                            <Text style={styles.pendingScoreValue}>{score}%</Text>
                            <Text style={styles.pendingScoreNote}>
                                Final score will be updated after teacher review
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

                            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                                <Text style={styles.continueButtonText}>Back to Dashboard</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Quiz Results" />
            <ScrollView contentContainerStyle={styles.content}>
            {passed ? (
                <>
                    <QuizCelebration
                        score={correctAnswers}
                        totalQuestions={totalQuestions}
                    />

                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>
                            {unlockedNextChapter ? "Continue to Next Chapter" : "Back to Dashboard"}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.correctionsButton} onPress={handleViewCorrections}>
                        <Ionicons name="document-text-outline" size={20} color="#F2B138" />
                        <Text style={styles.correctionsButtonText}>View Corrections</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={styles.failureContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="refresh" size={60} color="#E57373" />
                            </View>
                        </View>

                        <Text style={styles.failureTitle}>Let&apos;s Review That Again</Text>

                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreText}>
                                {correctAnswers} / {totalQuestions}
                            </Text>
                            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
                        </View>

                        <View style={styles.messageContainer}>
                            <Text style={styles.messageText}>
                                Don&apos;t worry! You can reread the chapter or try a different quiz on this topic.
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

                            <TouchableOpacity
                                style={styles.correctionsButton}
                                onPress={handleViewCorrections}
                            >
                                <Ionicons name="document-text-outline" size={20} color="#F2B138" />
                                <Text style={styles.correctionsButtonText}>View Corrections</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
        </View>
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
    correctionsButton: {
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
        marginTop: 12,
    },
    correctionsButtonText: {
        color: "#F2B138",
        fontSize: 16,
        fontWeight: "700",
    },
    pendingContainer: {
        alignItems: "center",
        padding: 24,
    },
    pendingIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFF8E1",
        justifyContent: "center",
        alignItems: "center",
    },
    pendingTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#282F2E",
        marginBottom: 12,
        textAlign: "center",
    },
    pendingSubtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    pendingInfoCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        width: "100%",
        gap: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    pendingInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    pendingInfoText: {
        flex: 1,
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
    },
    pendingScoreContainer: {
        backgroundColor: "#F9FBFB",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    pendingScoreLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    pendingScoreValue: {
        fontSize: 48,
        fontWeight: "800",
        color: "#F2B138",
    },
    pendingScoreNote: {
        fontSize: 12,
        color: "#999",
        marginTop: 8,
        textAlign: "center",
    },
});
