import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface QuizProgressProps {
    currentQuestion: number;
    totalQuestions: number;
}

export default function QuizProgress({
    currentQuestion,
    totalQuestions,
}: QuizProgressProps) {
    const progress = (currentQuestion / totalQuestions) * 100;
    const animatedProgress = useRef(new Animated.Value(progress)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 240,
            useNativeDriver: false,
        }).start();
    }, [progress, animatedProgress]);

    return (
        <View style={styles.container}>
            <View style={styles.progressBarContainer}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: animatedProgress.interpolate({
                                inputRange: [0, 100],
                                outputRange: ["0%", "100%"],
                            }),
                        },
                    ]}
                />
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
