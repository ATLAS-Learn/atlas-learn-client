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
import { AssessmentResult, SubjectBreakdown, PerSubjectRecommendation } from "@/lib/types";
import { LEVEL_INFO } from "@/lib/constants/levels";

export default function ProfileAssessmentResultScreen() {
    const router = useRouter();
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadResult = async () => {
            try {
                const data = await apiClient.getAssessmentResult();
                setResult(data);
            } catch (err: any) {
                setError(err.message || "Failed to load assessment result.");
            } finally {
                setLoading(false);
            }
        };
        loadResult();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 70) return "#4CAF50";
        if (score >= 40) return "#FF9800";
        return "#E57373";
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading assessment result...</Text>
            </View>
        );
    }

    if (error || !result) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Assessment Result</Text>
                    <View style={styles.backButton} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#E57373" />
                    <Text style={styles.errorText}>{error || "No assessment result found."}</Text>
                </View>
            </View>
        );
    }

    const levelInfo = LEVEL_INFO[result.level];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assessment Result</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Level Badge */}
                <View style={styles.levelSection}>
                    <View style={[styles.levelCircle, { backgroundColor: `${levelInfo.color}20` }]}>
                        <Ionicons name="trophy" size={40} color={levelInfo.color} />
                    </View>
                    <View style={[styles.levelBadge, { borderColor: levelInfo.color }]}>
                        <Text style={[styles.levelText, { color: levelInfo.color }]}>
                            {levelInfo.label} Level
                        </Text>
                    </View>
                    <Text style={styles.scoreText}>{result.score}%</Text>
                </View>

                {/* Subject Breakdown */}
                {result.subjectBreakdown && result.subjectBreakdown.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Performance by Subject</Text>
                        {result.subjectBreakdown.map((subject: SubjectBreakdown) => (
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
                {result.perSubjectRecommendations && result.perSubjectRecommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recommended Starting Points</Text>
                        {result.perSubjectRecommendations.map((rec: PerSubjectRecommendation) => (
                            <TouchableOpacity
                                key={rec.subjectId}
                                style={styles.recommendedCard}
                                onPress={() => {
                                    router.push({
                                        pathname: "/(tabs)/learn/subjects/[subjectId]",
                                        params: { subjectId: rec.subjectId },
                                    } as any);
                                }}
                            >
                                <Ionicons name="rocket-outline" size={24} color="#F2B138" />
                                <View style={styles.recommendedInfo}>
                                    <Text style={styles.recommendedSubject}>{rec.subjectName}</Text>
                                    {rec.recommendedChapter && (
                                        <Text style={styles.recommendedChapter}>{rec.recommendedChapter.title}</Text>
                                    )}
                                    <Text style={styles.recommendedScore}>{rec.score}% on assessment</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#999" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* View Corrections Button */}
                {result.corrections && result.corrections.length > 0 && (
                    <TouchableOpacity
                        style={styles.viewCorrectionsButton}
                        onPress={() => router.push("/(tabs)/profile/assessment-corrections" as any)}
                    >
                        <Ionicons name="document-text-outline" size={20} color="#F2B138" />
                        <Text style={styles.viewCorrectionsText}>View All Corrections</Text>
                        <Ionicons name="chevron-forward" size={18} color="#999" />
                    </TouchableOpacity>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        paddingTop: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#282F2E" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
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
        padding: 24,
    },
    levelSection: {
        alignItems: "center",
        marginBottom: 32,
    },
    levelCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    levelBadge: {
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    levelText: {
        fontSize: 18,
        fontWeight: "700",
    },
    scoreText: {
        fontSize: 36,
        fontWeight: "800",
        color: "#282F2E",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 12,
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
    recommendedCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF9E6",
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
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
        fontSize: 13,
        fontWeight: "600",
        color: "#999",
        marginBottom: 2,
    },
    recommendedScore: {
        fontSize: 12,
        color: "#F2B138",
        fontWeight: "600",
        marginTop: 2,
    },
    viewCorrectionsButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#FFF9E6",
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#FFE082",
    },
    viewCorrectionsText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#F2B138",
        flex: 1,
    },
});
