import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryArea } from "victory-native";
import { QuizAttempt } from "@/lib/types";

interface QuizScoresChartProps {
    attempts: QuizAttempt[];
}

export default function QuizScoresChart({ attempts }: QuizScoresChartProps) {
    if (attempts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No quiz attempts to display</Text>
            </View>
        );
    }

    // Sort attempts by date and prepare data for chart
    const chartData = attempts
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        .map((attempt, index) => ({
            x: index + 1,
            y: attempt.score ?? 0,
            label: `${Math.round(attempt.score ?? 0)}%`,
        }));

    const screenWidth = Dimensions.get("window").width - 48; // Account for padding

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quiz Performance Over Time</Text>
            <VictoryChart
                width={screenWidth}
                height={220}
                theme={VictoryTheme.material}
                padding={{ left: 70, right: 20, top: 20, bottom: 60 }}
            >
                <VictoryAxis
                    label="Attempt Number"
                    style={{
                        axisLabel: { padding: 45, fontSize: 12 },
                        tickLabels: { fontSize: 10 },
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    label="Score (%)"
                    style={{
                        axisLabel: { padding: 55, fontSize: 12 },
                        tickLabels: { fontSize: 10 },
                    }}
                />
                <VictoryArea
                    data={chartData}
                    style={{
                        data: {
                            fill: "#F2B138",
                            fillOpacity: 0.3,
                            stroke: "#F2B138",
                            strokeWidth: 2,
                        },
                    }}
                />
                <VictoryLine
                    data={chartData}
                    style={{
                        data: {
                            stroke: "#F2B138",
                            strokeWidth: 2,
                        },
                    }}
                />
            </VictoryChart>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 12,
    },
    emptyContainer: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
    },
});
