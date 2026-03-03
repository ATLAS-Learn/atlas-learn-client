import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Level } from "@/lib/types";
import { LEVEL_INFO } from "@/lib/constants/levels";
import { useUserStore } from "@/lib/store/user";
import { setItem } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";

export default function AssessmentResultScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const params = useLocalSearchParams();
    const { updateLevel } = useUserStore();

    const hasRouteResult = useMemo(
        () =>
            typeof params.score === "string" &&
            typeof params.totalQuestions === "string" &&
            typeof params.level === "string",
        [params.level, params.score, params.totalQuestions]
    );

    const [score, setScore] = useState(parseInt(params.score as string) || 0);
    const [totalQuestions, setTotalQuestions] = useState(parseInt(params.totalQuestions as string) || 5);
    const [level, setLevel] = useState((params.level as Level) || Level.FOUNDATIONAL);
    const [message, setMessage] = useState((params.message as string) || "");
    const [loadingResult, setLoadingResult] = useState(!hasRouteResult);

    const levelInfo = LEVEL_INFO[level];
    const percentage = (score / totalQuestions) * 100;

    useEffect(() => {
        let mounted = true;

        const loadResult = async () => {
            if (hasRouteResult) {
                setLoadingResult(false);
                return;
            }

            try {
                const result = await apiClient.getAssessmentResult();
                if (!mounted) return;
                setScore(Number(result.score || 0));
                setTotalQuestions(Number(result.totalQuestions || 5));
                setLevel((result.level as Level) || Level.FOUNDATIONAL);
                setMessage(result.message || "");
            } catch (error: any) {
                if (!mounted) return;
                Alert.alert("Result Unavailable", error.message || "Failed to load assessment result.");
            } finally {
                if (mounted) {
                    setLoadingResult(false);
                }
            }
        };

        loadResult();
        return () => {
            mounted = false;
        };
    }, [hasRouteResult]);

    useEffect(() => {
        // Update user level in store
        updateLevel(level);
    }, [level, updateLevel]);

    const handleContinue = async () => {
        await setItem("assessmentComplete", "true");
        router.replace("/(tabs)");
    };

    const iconSize = width < 390 ? 48 : 60;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { padding: width < 390 ? 16 : 24, paddingTop: Math.max(24, Math.floor(height * 0.06)) }]}
        >
            {loadingResult ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                    <Text style={styles.loadingText}>Loading your result...</Text>
                </View>
            ) : (
                <>
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

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
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
        alignItems: "center",
    },
    loadingContainer: {
        flex: 1,
        minHeight: 320,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: "#666",
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
