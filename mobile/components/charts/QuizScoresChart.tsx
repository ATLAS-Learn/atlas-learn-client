import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { VictoryAxis, VictoryArea, VictoryChart, VictoryLine, VictoryScatter } from "victory-native";
import { UserQuizAttempt } from "@/lib/types";

interface QuizScoresChartProps {
    attempts: UserQuizAttempt[];
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
    const chartData = [...attempts]
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        .map((attempt, index) => ({
            x: index + 1,
            y: typeof attempt.percentage === "number" ? attempt.percentage : attempt.score,
            label: `${Math.round(typeof attempt.percentage === "number" ? attempt.percentage : attempt.score)}%`,
        }));

    const screenWidth = Dimensions.get("window").width - 48; // Account for padding
    const latestScore = chartData[chartData.length - 1]?.y ?? 0;
    const highestScore = chartData.reduce((max, point) => Math.max(max, point.y), 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Progress Trend</Text>
                    <Text style={styles.subtitle}>A simple view of how your recent quiz scores are moving.</Text>
                </View>
                <View style={styles.summaryPill}>
                    <Text style={styles.summaryValue}>{Math.round(latestScore)}%</Text>
                    <Text style={styles.summaryLabel}>latest</Text>
                </View>
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Best</Text>
                    <Text style={styles.summaryCardValue}>{Math.round(highestScore)}%</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Attempts</Text>
                    <Text style={styles.summaryCardValue}>{chartData.length}</Text>
                </View>
            </View>

            <VictoryChart
                width={screenWidth}
                height={250}
                domain={{ y: [0, 100] }}
                padding={{ left: 44, right: 18, top: 24, bottom: 42 }}
            >
                <VictoryAxis
                    tickValues={chartData.map((point) => point.x)}
                    style={{
                        axis: { stroke: "#D9E4E1" },
                        grid: { stroke: "transparent" },
                        ticks: { stroke: "#D9E4E1", size: 4 },
                        tickLabels: { fontSize: 10, fill: "#6E7E7A", padding: 6 },
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickValues={[0, 25, 50, 75, 100]}
                    style={{
                        axis: { stroke: "transparent" },
                        grid: { stroke: "#E9EFED", strokeDasharray: "6, 6" },
                        ticks: { stroke: "transparent" },
                        tickLabels: { fontSize: 10, fill: "#6E7E7A", padding: 6 },
                    }}
                />
                <VictoryArea
                    data={chartData}
                    interpolation="monotoneX"
                    style={{
                        data: {
                            fill: "#F2B138",
                            fillOpacity: 0.18,
                            stroke: "transparent",
                        },
                    }}
                />
                <VictoryLine
                    data={chartData}
                    interpolation="monotoneX"
                    style={{
                        data: {
                            stroke: "#084A59",
                            strokeWidth: 3,
                            strokeLinecap: "round",
                        },
                    }}
                />
                <VictoryScatter
                    data={chartData}
                    size={4.5}
                    style={{
                        data: {
                            fill: "#12A67C",
                            stroke: "#FFFFFF",
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
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E6ECE9",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "#011C26",
    },
    subtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: "#6E7E7A",
        maxWidth: 220,
    },
    summaryPill: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: "#EEF6F3",
        alignItems: "center",
        minWidth: 72,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#084A59",
    },
    summaryLabel: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: "700",
        color: "#12A67C",
        textTransform: "uppercase",
    },
    summaryRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 6,
    },
    summaryCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        backgroundColor: "#F8FAF9",
    },
    summaryCardLabel: {
        fontSize: 12,
        color: "#6E7E7A",
        fontWeight: "600",
    },
    summaryCardValue: {
        marginTop: 6,
        fontSize: 18,
        fontWeight: "800",
        color: "#011C26",
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
