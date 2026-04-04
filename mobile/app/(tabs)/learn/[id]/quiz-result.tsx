import { useEffect, useRef, useState } from "react";
import {
    Alert,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Easing,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QuizCelebration from "@/components/quizzes/quiz-celebration";
import { apiClient } from "@/lib/api";

export default function QuizResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id: string;
        subjectId?: string;
        score: string;
        totalQuestions: string;
        percentage: string;
        passed: string;
        pastPaperReference?: string;
        unlockedNextChapter: string;
        quizId?: string;
    }>();

    const score = parseInt(params.score as string) || 0;
    const totalQuestions = parseInt(params.totalQuestions as string) || 0;
    const percentage = parseFloat(params.percentage as string) || 0;
    const passed = params.passed === "true";
    const pastPaperReference = params.pastPaperReference as string | undefined;
    const unlockedNextChapter = params.unlockedNextChapter === "true";
    const subjectId = Array.isArray(params.subjectId) ? params.subjectId[0] : params.subjectId;
    const headerAnimation = useRef(new Animated.Value(0)).current;
    const scoreAnimation = useRef(new Animated.Value(0)).current;
    const [continuing, setContinuing] = useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnimation, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scoreAnimation, {
                toValue: 1,
                tension: 80,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [headerAnimation, scoreAnimation]);

    const headerStyle = {
        opacity: headerAnimation,
        transform: [
            {
                translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                }),
            },
            {
                scale: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                }),
            },
        ],
    };

    const scoreStyle = {
        transform: [
            {
                scale: scoreAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                }),
            },
        ],
    };

    const getNextSubjectChapterId = async (currentChapterId: string, currentSubjectId: string) => {
        const subjectChapters = await apiClient.getSubjectChapters(currentSubjectId);
        const sorted = Array.isArray(subjectChapters)
            ? [...subjectChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            : [];
        const currentIndex = sorted.findIndex((chapter) => chapter.id === currentChapterId);
        if (currentIndex < 0 || currentIndex >= sorted.length - 1) {
            return undefined;
        }
        return sorted[currentIndex + 1]?.id;
    };

    const getNextGlobalChapterId = async (currentChapterId: string) => {
        const chapters = await apiClient.getChapters();
        const sorted = Array.isArray(chapters)
            ? [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : [];
        const currentIndex = sorted.findIndex((chapter) => chapter.id === currentChapterId);
        if (currentIndex < 0 || currentIndex >= sorted.length - 1) {
            return undefined;
        }
        return sorted[currentIndex + 1]?.id;
    };

    const handleContinue = async () => {
        if (!params.id) {
            router.replace("/(tabs)/learn");
            return;
        }

        if (!passed) {
            router.back();
            return;
        }

        if (!unlockedNextChapter) {
            if (subjectId) {
                router.replace({
                    pathname: "/(tabs)/learn/subjects/[subjectId]",
                    params: { subjectId },
                } as any);
                return;
            }
            router.replace("/(tabs)/learn");
            return;
        }

        setContinuing(true);
        try {
            const nextChapterId = subjectId
                ? await getNextSubjectChapterId(params.id, subjectId)
                : await getNextGlobalChapterId(params.id);

            if (subjectId) {
                router.replace({
                    pathname: "/(tabs)/learn/subjects/[subjectId]",
                    params: {
                        subjectId,
                        ...(nextChapterId ? { highlightChapterId: nextChapterId } : {}),
                    },
                } as any);
                return;
            }

            router.replace({
                pathname: "/(tabs)/learn/chapters",
                params: nextChapterId ? { highlightChapterId: nextChapterId } : {},
            } as any);
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Could not open the unlocked chapter list.");
        } finally {
            setContinuing(false);
        }
    };

    const handleReviewChapter = () => {
        if (params.id) {
            router.push(`/(tabs)/learn/${params.id}`);
        } else {
            router.back();
        }
    };

    const handleTryAgain = () => {
        if (!params.id) {
            return router.back();
        }
        if (subjectId) {
            router.push({
                pathname: "/(tabs)/learn/[id]/quiz",
                params: { id: params.id, subjectId },
            } as any);
        } else {
            router.push(`/(tabs)/learn/${params.id}/quiz`);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Animated.View style={headerStyle}>
                {passed ? (
                    <QuizCelebration
                        score={score}
                        totalQuestions={totalQuestions}
                        pastPaperReference={pastPaperReference}
                    />
                ) : (
                    <View style={styles.failureContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="refresh" size={60} color="#F44336" />
                            </View>
                        </View>

                        <Text style={styles.failureTitle}>Let&apos;s Review That Again</Text>

                        <Animated.View style={scoreStyle}>
                            <View style={styles.scoreContainer}>
                                <Text style={styles.scoreText}>
                                    {score} / {totalQuestions}
                                </Text>
                                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
                            </View>
                        </Animated.View>

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
                        </View>
                    </View>
                )}
            </Animated.View>

            <Animated.View style={[headerStyle, styles.footerSpacer]}>
                <TouchableOpacity
                    style={[styles.continueButton, continuing && styles.continueButtonDisabled]}
                    onPress={() => void handleContinue()}
                    disabled={continuing}
                >
                    <Text style={styles.continueButtonText}>
                        {unlockedNextChapter ? "See Unlocked Chapter" : "Back to Dashboard"}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
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
    footerSpacer: {
        marginTop: 24,
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
    },
    continueButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    continueButtonDisabled: {
        opacity: 0.7,
    },
});
