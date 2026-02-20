import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface QuizProgressProps {
    currentQuestion: number;
    totalQuestions: number;
}

export default function QuizProgress({
    currentQuestion,
    totalQuestions,
}: QuizProgressProps) {
    const progress = (currentQuestion / totalQuestions) * 100;

    return (
        <View style={styles.container}>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
                Question {currentQuestion} of {totalQuestions}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#F2B138",
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "600",
        textAlign: "center",
    },
});
