import React, { useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { QuizQuestion } from "@/lib/types";

interface QuestionCardProps {
    question: QuizQuestion;
    selectedAnswer: number | null;
    onSelectAnswer: (answerIndex: number) => void;
    showResult?: boolean;
}

export default function QuestionCard({
    question,
    selectedAnswer,
    onSelectAnswer,
    showResult = false,
}: QuestionCardProps) {
    const readableQuestion = useMemo(
        () =>
            typeof question.question === "string" && question.question.trim().length > 0
                ? question.question
                : typeof question.questionText === "string"
                    ? question.questionText
                    : "",
        [question.question, question.questionText]
    );
    const correctAnswer = useMemo(() => {
        if (typeof question.correctAnswer === "number") {
            return question.correctAnswer;
        }
        return typeof question.correctAnswerIndex === "number" ? question.correctAnswerIndex : -1;
    }, [question.correctAnswer, question.correctAnswerIndex]);

    const pressAnimations = useRef<Animated.Value[]>([]);
    if (pressAnimations.current.length !== question.options.length) {
        pressAnimations.current = question.options.map(() => new Animated.Value(1));
    }

    const getOptionStyle = (index: number) => {
        if (showResult) {
            if (index === correctAnswer) return styles.optionCorrect;
            if (selectedAnswer === index && index !== correctAnswer) return styles.optionIncorrect;
            return styles.option;
        }

        if (selectedAnswer === index) {
            return styles.optionSelected;
        }
        return styles.option;
    };

    const handleSelectAnswer = (answerIndex: number) => {
        Animated.spring(pressAnimations.current[answerIndex], {
            toValue: 0.98,
            speed: 220,
            bounciness: 10,
            useNativeDriver: true,
        }).start(() => {
            Animated.spring(pressAnimations.current[answerIndex], {
                toValue: 1,
                speed: 220,
                bounciness: 10,
                useNativeDriver: true,
            }).start();
        });
        onSelectAnswer(answerIndex);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.questionText}>{readableQuestion}</Text>
            <View style={styles.optionsContainer}>
                {question.options.map((option, index) => (
                    <Animated.View
                        key={index}
                        style={{ transform: [{ scale: pressAnimations.current[index] }] }}
                    >
                        <TouchableOpacity
                            style={getOptionStyle(index)}
                            onPress={() => !showResult && handleSelectAnswer(index)}
                            disabled={showResult}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    selectedAnswer === index && styles.optionTextSelected,
                                    showResult && index === correctAnswer && styles.optionTextCorrect,
                                    showResult &&
                                        selectedAnswer === index &&
                                        index !== correctAnswer &&
                                        styles.optionTextIncorrect,
                                ]}
                            >
                                {option}
                            </Text>
                            {showResult && index === correctAnswer && (
                                <Text style={styles.correctBadge}>✓ Correct</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
            {showResult && question.explanation && (
                <View style={styles.explanationContainer}>
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    questionText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 16,
        lineHeight: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        borderWidth: 2,
        borderColor: "#E0E0E0",
        backgroundColor: "#F9FBFB",
        borderRadius: 12,
        padding: 16,
        minHeight: 56,
        justifyContent: "center",
    },
    optionSelected: {
        borderWidth: 2,
        borderColor: "#F2B138",
        backgroundColor: "#FFF9E6",
        borderRadius: 12,
        padding: 16,
        minHeight: 56,
        justifyContent: "center",
    },
    optionCorrect: {
        borderWidth: 2,
        borderColor: "#4CAF50",
        backgroundColor: "#E8F5E9",
        borderRadius: 12,
        padding: 16,
        minHeight: 56,
        justifyContent: "center",
    },
    optionIncorrect: {
        borderWidth: 2,
        borderColor: "#E57373",
        backgroundColor: "#FFEBEE",
        borderRadius: 12,
        padding: 16,
        minHeight: 56,
        justifyContent: "center",
    },
    optionText: {
        fontSize: 16,
        color: "#333",
        lineHeight: 22,
    },
    optionTextSelected: {
        color: "#282F2E",
        fontWeight: "600",
    },
    optionTextCorrect: {
        color: "#2E7D32",
        fontWeight: "600",
    },
    optionTextIncorrect: {
        color: "#E57373",
        fontWeight: "600",
    },
    correctBadge: {
        position: "absolute",
        right: 16,
        top: 16,
        color: "#4CAF50",
        fontWeight: "700",
        fontSize: 12,
    },
    explanationContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
    },
    explanationText: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
});
