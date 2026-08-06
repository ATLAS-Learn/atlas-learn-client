import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuizCelebrationProps {
    score: number;
    totalQuestions: number;
    pastPaperReference?: string;
}

export default function QuizCelebration({
    score,
    totalQuestions,
    pastPaperReference,
}: QuizCelebrationProps) {
    const percentage = (score / totalQuestions) * 100;
    const trophyScale = useRef(new Animated.Value(0.5)).current;
    const scoreBounce = useRef(new Animated.Value(0)).current;
    const confetti = useRef(
        Array.from({ length: 7 }).map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(trophyScale, {
                toValue: 1.1,
                useNativeDriver: true,
                friction: 4,
            }),
            Animated.spring(trophyScale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 4,
            }),
            Animated.spring(scoreBounce, {
                toValue: 1,
                useNativeDriver: true,
                tension: 80,
                friction: 7,
            }),
        ]).start();
        const confettiAnimations = confetti.map((item, index) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 100),
                    Animated.timing(item, {
                        toValue: 1,
                        duration: 700,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(item, {
                        toValue: 0,
                        duration: 700,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 4 }
            )
        );
        Animated.stagger(120, confettiAnimations).start();
    }, [confetti, scoreBounce, trophyScale]);

    return (
        <View style={styles.container}>
            <View style={styles.confettiRow}>
                {confetti.map((item, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.confetti,
                            {
                                opacity: item,
                                transform: [
                                    {
                                        translateY: item.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -18],
                                        }),
                                    },
                                    {
                                        rotate: item.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ["0deg", `${45 + index * 12}deg`],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                ))}
            </View>

            <Animated.View
                style={[styles.iconContainer, { transform: [{ scale: trophyScale }] }]}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="trophy" size={60} color="#F2B138" />
                </View>
            </Animated.View>

            <Text style={styles.title}>Chapter Complete!</Text>

            <Animated.View
                style={[
                    styles.scoreContainer,
                    {
                        transform: [
                            {
                                scale: scoreBounce.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Text style={styles.scoreText}>
                    {score} / {totalQuestions}
                </Text>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            </Animated.View>

            {pastPaperReference && (
                <View style={styles.referenceContainer}>
                    <Text style={styles.referenceText}>
                        Congratulations! You can now tackle questions like{" "}
                        <Text style={styles.referenceBold}>{pastPaperReference}</Text>
                    </Text>
                </View>
            )}

            <View style={styles.messageContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.messageText}>
<<<<<<< HEAD
                    Great work! You&apos;ve unlocked the next chapter.
=======
                    Great work! You&aposve unlocked the next chapter.
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        padding: 24,
    },
    confettiRow: {
        position: "absolute",
        top: 8,
        flexDirection: "row",
        width: "100%",
        justifyContent: "center",
        gap: 16,
        opacity: 0.65,
    },
    confetti: {
        width: 10,
        height: 10,
        borderRadius: 3,
        backgroundColor: "#F2B138",
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFF9E6",
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 32,
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
    referenceContainer: {
        backgroundColor: "#E8F5E9",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        width: "100%",
    },
    referenceText: {
        fontSize: 16,
        color: "#2E7D32",
        textAlign: "center",
        lineHeight: 24,
    },
    referenceBold: {
        fontWeight: "700",
    },
    messageContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F5F5F5",
        padding: 12,
        borderRadius: 8,
        width: "100%",
    },
    messageText: {
        fontSize: 14,
        color: "#333",
        flex: 1,
    },
});
