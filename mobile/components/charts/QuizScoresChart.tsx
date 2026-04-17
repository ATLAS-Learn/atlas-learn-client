import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart } from "victory-native";
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

    const orderedAttempts = [...attempts]
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        .slice(-6);

    const chartData = orderedAttempts.map((attempt, index) => ({
        x: index + 1,
        y: Math.max(
            0,
            Math.min(100, Math.round(typeof attempt.percentage === "number" ? attempt.percentage : attempt.score))
        ),
        label: new Date(attempt.completedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        fill: index === orderedAttempts.length - 1 ? "#F2B138" : "#12A67C",
    }));

    const screenWidth = Dimensions.get("window").width - 48;
    const latestScore = chartData[chartData.length - 1]?.y ?? 0;
    const highestScore = chartData.reduce((max, point) => Math.max(max, point.y), 0);
    const averageScore =
        chartData.length > 0
            ? Math.round(chartData.reduce((sum, point) => sum + point.y, 0) / chartData.length)
            : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Progress Trend</Text>
                    <Text style={styles.subtitle}>Your last {chartData.length} quiz attempts at a glance.</Text>
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
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Average</Text>
                    <Text style={styles.summaryCardValue}>{averageScore}%</Text>
                </View>
            </View>

            <View style={styles.chartPanel}>
                <VictoryChart
                    width={screenWidth}
                    height={260}
                    domain={{ y: [0, 100] }}
                    padding={{ left: 48, right: 20, top: 20, bottom: 50 }}
                >
                    <VictoryAxis
                        tickValues={chartData.map((point) => point.x)}
                        tickFormat={chartData.map((point) => point.label)}
                        style={{
                            axis: { stroke: "#D7E5E1" },
                            grid: { stroke: "transparent" },
                            ticks: { stroke: "#D7E5E1", size: 4 },
                            tickLabels: { fontSize: 10, fill: "#5F7470", padding: 8 },
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        tickValues={[0, 25, 50, 75, 100]}
                        tickFormat={(value) => `${value}%`}
                        style={{
                            axis: { stroke: "transparent" },
                            grid: { stroke: "#E5EFEC", strokeDasharray: "4, 6" },
                            ticks: { stroke: "transparent" },
                            tickLabels: { fontSize: 10, fill: "#5F7470", padding: 8 },
                        }}
                    />
                    <VictoryBar
                        data={chartData}
                        cornerRadius={{ top: 8 }}
                        barRatio={0.62}
                        style={{
                            data: {
                                fill: ({ datum }) => datum.fill,
                            },
                        }}
                    />
                </VictoryChart>
            </View>
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
        marginBottom: 12,
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
    chartPanel: {
        borderRadius: 18,
        backgroundColor: "#F8FBFA",
        borderWidth: 1,
        borderColor: "#E6EFEC",
        overflow: "hidden",
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
