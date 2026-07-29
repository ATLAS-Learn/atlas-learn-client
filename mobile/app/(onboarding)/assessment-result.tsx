import React, { useEffect, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Level, SubjectBreakdown, PerSubjectRecommendation } from "@/lib/types";
import { LEVEL_INFO } from "@/lib/constants/levels";
import { useUserStore } from "@/lib/store/user";
import { setItem } from "@/lib/utils/storage";

export default function AssessmentResultScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const params = useLocalSearchParams();
    const { updateLevel } = useUserStore();

    const score = parseInt(params.score as string) || 0;
    const totalQuestions = parseInt(params.totalQuestions as string) || 5;
    const level = (params.level as Level) || Level.FOUNDATIONAL;
    const message = (params.message as string) || "";

    const subjectBreakdown: SubjectBreakdown[] = useMemo(() => {
        try {
            return params.subjectBreakdown ? JSON.parse(params.subjectBreakdown as string) : [];
        } catch {
            return [];
        }
    }, [params.subjectBreakdown]);

    const recommendedChapter = useMemo(() => {
        try {
            return params.recommendedChapter ? JSON.parse(params.recommendedChapter as string) : null;
        } catch {
            return null;
        }
    }, [params.recommendedChapter]);

    const perSubjectRecommendations: PerSubjectRecommendation[] = useMemo(() => {
        try {
            return params.perSubjectRecommendations ? JSON.parse(params.perSubjectRecommendations as string) : [];
        } catch {
            return [];
        }
    }, [params.perSubjectRecommendations]);

    const levelInfo = LEVEL_INFO[level];
    const percentage = (score / totalQuestions) * 100;

    useEffect(() => {
        updateLevel(level);
    }, [level, updateLevel]);

    const handleContinue = async () => {
        await setItem("assessmentComplete", "true");
        router.replace("/(tabs)");
    };

    const handleStartLearning = async () => {
        await setItem("assessmentComplete", "true");
        // Navigate to first recommended subject's recommended chapter
        if (perSubjectRecommendations.length > 0) {
            const first = perSubjectRecommendations[0];
            if (first.recommendedChapter) {
                router.replace({
                    pathname: "/(tabs)/learn/[id]",
                    params: { id: first.recommendedChapter.id, subjectId: first.subjectId },
                });
                return;
            }
        }
        if (recommendedChapter?.id) {
            router.replace({
                pathname: "/(tabs)/learn/[id]",
                params: { id: recommendedChapter.id },
            });
        } else {
            router.replace("/(tabs)");
        }
    };

    const getScoreColor = (s: number) => {
        if (s >= 70) return "#4CAF50";
        if (s >= 40) return "#FF9800";
        return "#F44336";
    };

    const iconSize = width < 390 ? 48 : 60;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { padding: width < 390 ? 16 : 24, paddingTop: Math.max(24, Math.floor(height * 0.06)) }]}
        >
            <View style={[styles.iconContainer, { marginTop: width < 390 ? 16 : 32 }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${levelInfo.color}20`, width: iconSize + 60, height: iconSize + 60, borderRadius: (iconSize + 60) / 2 }]}>
                    <Ionicons name="trophy" size={iconSize} color={levelInfo.color} />
                </View>
            </View>

            <Text style={styles.title}>Assessment Complete!</Text>

            <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                    {score} / {totalQuestions}
                </Text>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            </View>

            <View style={[styles.levelBadge, { borderColor: levelInfo.color }]}>
                <Text style={[styles.levelText, { color: levelInfo.color }]}>
                    {levelInfo.label} Level
                </Text>
            </View>

            <Text style={styles.message}>{message}</Text>

            {/* Subject Breakdown */}
            {subjectBreakdown.length > 0 && (
                <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownTitle}>Performance by Subject</Text>
                    {subjectBreakdown.map((subject) => (
                        <View key={subject.subjectId} style={styles.breakdownCard}>
                            <View style={styles.breakdownHeader}>
                                <Text style={styles.breakdownSubject}>{subject.subjectName}</Text>
                                <Text style={[styles.breakdownScore, { color: getScoreColor(subject.score) }]}>
                                    {subject.correct}/{subject.total} ({subject.score}%)
                                </Text>
                            </View>
                            <View style={styles.breakdownBarBg}>
                                <View
                                    style={[
                                        styles.breakdownBarFill,
                                        { width: `${subject.score}%`, backgroundColor: getScoreColor(subject.score) },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Recommended Starting Points per Subject */}
            {perSubjectRecommendations.length > 0 && (
                <View style={styles.recommendedContainer}>
                    <Text style={styles.recommendedTitle}>Recommended Starting Points</Text>
                    {perSubjectRecommendations.map((rec) => (
                        <View key={rec.subjectId} style={styles.recommendedCard}>
                            <Ionicons name="rocket-outline" size={24} color="#F2B138" />
                            <View style={styles.recommendedInfo}>
                                <Text style={styles.recommendedSubject}>{rec.subjectName}</Text>
                                {rec.recommendedChapter && (
                                    <Text style={styles.recommendedChapter}>{rec.recommendedChapter.title}</Text>
                                )}
                                <Text style={styles.recommendedScore}>{rec.score}% on assessment</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                    <Ionicons name="book-outline" size={24} color="#666" />
                    <Text style={styles.infoText}>
                        You&apos;ll start with {levelInfo.label.toLowerCase()} content
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="trending-up-outline" size={24} color="#666" />
                    <Text style={styles.infoText}>
                        Progress at your own pace
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="star-outline" size={24} color="#666" />
                    <Text style={styles.infoText}>
                        Unlock new chapters as you learn
                    </Text>
                </View>
            </View>

            {recommendedChapter && (
                <TouchableOpacity style={styles.startButton} onPress={handleStartLearning}>
                    <Ionicons name="play-circle-outline" size={22} color="#fff" />
                    <Text style={styles.startButtonText}>Start Learning</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
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
        alignItems: "center",
    },
    iconContainer: {
        marginTop: 40,
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#282F2E",
        textAlign: "center",
        marginBottom: 24,
    },
    scoreContainer: {
        alignItems: "center",
        marginBottom: 16,
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
    levelBadge: {
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    levelText: {
        fontSize: 18,
        fontWeight: "700",
    },
    message: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    infoContainer: {
        width: "100%",
        marginBottom: 40,
        gap: 16,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
    },
    infoText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
    },
    // Subject Breakdown
    breakdownContainer: {
        width: "100%",
        marginBottom: 24,
    },
    breakdownTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 12,
        textAlign: "center",
    },
    breakdownCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    breakdownHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    breakdownSubject: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2524",
    },
    breakdownScore: {
        fontSize: 14,
        fontWeight: "700",
    },
    breakdownBarBg: {
        height: 6,
        backgroundColor: "#EEE",
        borderRadius: 3,
        overflow: "hidden",
    },
    breakdownBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    // Recommended Chapter
    recommendedContainer: {
        width: "100%",
        marginBottom: 24,
    },
    recommendedTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 12,
        textAlign: "center",
    },
    recommendedCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF9E6",
        borderRadius: 14,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: "#FFE082",
    },
    recommendedInfo: {
        flex: 1,
    },
    recommendedChapter: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2524",
    },
    recommendedSubject: {
        fontSize: 12,
        color: "#999",
        fontWeight: "600",
        marginTop: 2,
    },
    recommendedScore: {
        fontSize: 12,
        color: "#F2B138",
        fontWeight: "600",
        marginTop: 2,
    },
    // Start Learning Button
    startButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        minWidth: 200,
        justifyContent: "center",
        marginBottom: 12,
    },
    startButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    continueButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        minWidth: 200,
        justifyContent: "center",
        marginBottom: 24,
    },
    continueButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});
