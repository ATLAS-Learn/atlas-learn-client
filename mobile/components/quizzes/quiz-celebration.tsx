import React from "react";
import { View, Text, StyleSheet } from "react-native";
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

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="trophy" size={60} color="#F2B138" />
                </View>
            </View>

            <Text style={styles.title}>Chapter Complete!</Text>

            <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                    {score} / {totalQuestions}
                </Text>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            </View>

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
                    Great work! You've unlocked the next chapter.
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
