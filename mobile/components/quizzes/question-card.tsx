import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { QuizQuestion } from "@/lib/types";

interface QuestionCardProps {
    question: QuizQuestion;
    selectedAnswer: number | null;
    onSelectAnswer: (answerIndex: number) => void;
    showResult?: boolean;
    feedback?: boolean | undefined; // immediate correctness hint (optimistic)
}

export default function QuestionCard({
    question,
    selectedAnswer,
    onSelectAnswer,
    showResult = false,
    feedback,
}: QuestionCardProps) {
    const getOptionStyle = (index: number) => {
        if (!showResult) {
            // If optimistic feedback is available, show correct/incorrect immediately
            if (typeof feedback === "boolean") {
                if (index === question.correctAnswerIndex) return styles.optionCorrect;
                if (selectedAnswer === index && index !== question.correctAnswerIndex) return styles.optionIncorrect;
            }
            return selectedAnswer === index ? styles.optionSelected : styles.option;
        }

        if (index === question.correctAnswerIndex) {
            return styles.optionCorrect;
        }
        if (selectedAnswer === index && index !== question.correctAnswerIndex) {
            return styles.optionIncorrect;
        }
        return styles.option;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.questionText}>{question.questionText}</Text>
            <View style={styles.optionsContainer}>
                {question.options.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={getOptionStyle(index)}
                        onPress={() => !showResult && onSelectAnswer(index)}
                        disabled={showResult}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                selectedAnswer === index && styles.optionTextSelected,
                                (showResult || typeof feedback === "boolean") && index === question.correctAnswerIndex && styles.optionTextCorrect,
                                (showResult || typeof feedback === "boolean") && selectedAnswer === index && index !== question.correctAnswerIndex && styles.optionTextIncorrect,
                            ]}
                        >
                            {option}
                        </Text>
                        {showResult && index === question.correctAnswerIndex && (
                            <Text style={styles.correctBadge}>✓ Correct</Text>
                        )}
                    </TouchableOpacity>
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
