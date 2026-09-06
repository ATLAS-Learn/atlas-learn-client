import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QuizQuestion } from "@/lib/types";

interface QuestionCardProps {
    question: QuizQuestion;
    selectedAnswer: number | null;
    onSelectAnswer: (answerIndex: number) => void;
    showResult?: boolean;
    essayValue?: string;
    onEssayChange?: (text: string) => void;
}

export default function QuestionCard({
    question,
    selectedAnswer,
    onSelectAnswer,
    showResult = false,
    essayValue = "",
    onEssayChange,
}: QuestionCardProps) {
    const isStructural = question.questionType === "STRUCTURAL";

    const getOptionStyle = (index: number) => {
        if (showResult) {
            if (index === question.correctAnswerIndex) return styles.optionCorrect;
            if (selectedAnswer === index && index !== question.correctAnswerIndex) return styles.optionIncorrect;
            return styles.option;
        }
        return selectedAnswer === index ? styles.optionSelected : styles.option;
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
        >
            <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>
                    {isStructural ? "Essay" : "Multiple Choice"}
                </Text>
                {question.points > 0 && (
                    <Text style={styles.pointsBadge}>{question.points} pts</Text>
                )}
            </View>

            <Text style={styles.questionText}>{question.questionText}</Text>

            {isStructural ? (
                <View style={styles.essayContainer}>
                    <Text style={styles.essayLabel}>Write your answer below:</Text>
                    <TextInput
                        style={styles.essayInput}
                        value={essayValue}
                        onChangeText={onEssayChange}
                        placeholder="Type your answer here..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        editable={!showResult}
                    />
                    <Text style={styles.essayHint}>
                        {essayValue.length} / 2000 characters
                    </Text>
                </View>
            ) : (
                <View style={styles.optionsContainer}>
                    {question.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={getOptionStyle(index)}
                            onPress={() => !showResult && onSelectAnswer(index)}
                            disabled={showResult}
                        >
                            <View style={styles.optionRow}>
                                <View style={[
                                    styles.optionLetter,
                                    selectedAnswer === index && styles.optionLetterSelected,
                                    showResult && index === question.correctAnswerIndex && styles.optionLetterCorrect,
                                    showResult && selectedAnswer === index && index !== question.correctAnswerIndex && styles.optionLetterIncorrect,
                                ]}>
                                    <Text style={[
                                        styles.optionLetterText,
                                        selectedAnswer === index && styles.optionLetterTextSelected,
                                        showResult && index === question.correctAnswerIndex && styles.optionLetterTextCorrect,
                                        showResult && selectedAnswer === index && index !== question.correctAnswerIndex && styles.optionLetterTextIncorrect,
                                    ]}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedAnswer === index && styles.optionTextSelected,
                                        showResult && index === question.correctAnswerIndex && styles.optionTextCorrect,
                                        showResult && selectedAnswer === index && index !== question.correctAnswerIndex && styles.optionTextIncorrect,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </View>
                            {showResult && index === question.correctAnswerIndex && (
                                <Text style={styles.correctBadge}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {showResult && question.explanation && (
                <View style={styles.explanationContainer}>
                    <Ionicons name="bulb-outline" size={16} color="#F2B138" />
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    questionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    questionBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#084A59",
        backgroundColor: "#084A5915",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: "hidden",
    },
    pointsBadge: {
        fontSize: 11,
        fontWeight: "600",
        color: "#F2B138",
        backgroundColor: "#F2B13820",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: "hidden",
    },
    questionText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 16,
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 10,
    },
    option: {
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
        backgroundColor: "#F9FBFB",
        borderRadius: 14,
        padding: 14,
        minHeight: 56,
        justifyContent: "center",
    },
    optionSelected: {
        borderWidth: 2,
        borderColor: "#084A59",
        backgroundColor: "#084A5910",
        borderRadius: 14,
        padding: 14,
        minHeight: 56,
        justifyContent: "center",
    },
    optionCorrect: {
        borderWidth: 2,
        borderColor: "#4CAF50",
        backgroundColor: "#E8F5E9",
        borderRadius: 14,
        padding: 14,
        minHeight: 56,
        justifyContent: "center",
    },
    optionIncorrect: {
        borderWidth: 2,
        borderColor: "#E57373",
        backgroundColor: "#FFEBEE",
        borderRadius: 14,
        padding: 14,
        minHeight: 56,
        justifyContent: "center",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    optionLetter: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: "#D0D0D0",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
    },
    optionLetterSelected: {
        borderColor: "#084A59",
        backgroundColor: "#084A59",
    },
    optionLetterCorrect: {
        borderColor: "#4CAF50",
        backgroundColor: "#4CAF50",
    },
    optionLetterIncorrect: {
        borderColor: "#E57373",
        backgroundColor: "#E57373",
    },
    optionLetterText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#666",
    },
    optionLetterTextSelected: {
        color: "#FFF",
    },
    optionLetterTextCorrect: {
        color: "#FFF",
    },
    optionLetterTextIncorrect: {
        color: "#FFF",
    },
    optionText: {
        flex: 1,
        fontSize: 15,
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
        fontSize: 16,
    },
    essayContainer: {
        marginTop: 4,
    },
    essayLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
        marginBottom: 10,
    },
    essayInput: {
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
        backgroundColor: "#F9FBFB",
        borderRadius: 14,
        padding: 16,
        fontSize: 15,
        color: "#333",
        lineHeight: 22,
        minHeight: 160,
        maxHeight: 300,
        textAlignVertical: "top",
    },
    essayHint: {
        fontSize: 11,
        color: "#999",
        marginTop: 6,
        textAlign: "right",
    },
    explanationContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        marginTop: 14,
        padding: 14,
        backgroundColor: "#FFF8E8",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F2B13830",
    },
    explanationText: {
        flex: 1,
        fontSize: 14,
        color: "#666",
        lineHeight: 21,
    },
});
