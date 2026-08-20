import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryArea, VictoryScatter, VictoryLabel } from "victory-native";
import { QuizAttempt } from "@/lib/types";

interface QuizScoresChartProps {
    attempts: QuizAttempt[];
}

const DEFAULT_SHOW = 15;

export default function QuizScoresChart({ attempts }: QuizScoresChartProps) {
    const [showAll, setShowAll] = useState(false);

    if (attempts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No quiz attempts to display</Text>
            </View>
        );
    }

    // Sort attempts by date
    const sorted = [...attempts].sort(
        (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    const totalAttempts = sorted.length;
    const displayAttempts = showAll ? sorted : sorted.slice(-DEFAULT_SHOW);
    const offset = showAll ? 0 : Math.max(0, totalAttempts - DEFAULT_SHOW);

    // Prepare chart data
    const chartData = displayAttempts.map((attempt, i) => ({
        x: offset + i + 1,
        y: attempt.score ?? 0,
    }));

    const screenWidth = Dimensions.get("window").width - 48;
    const count = chartData.length;

    // Determine tick interval to avoid label overlap
    const tickInterval = count <= 10 ? 1 : count <= 20 ? 2 : count <= 40 ? 5 : 10;

    // Only label key points: first, last, min, max
    const minIdx = chartData.reduce((mi, d, i, arr) => d.y < arr[mi].y ? i : mi, 0);
    const maxIdx = chartData.reduce((mi, d, i, arr) => d.y > arr[mi].y ? i : mi, 0);
    const keyIndices = new Set([0, chartData.length - 1, minIdx, maxIdx]);

    const scatterData = chartData.map((d, i) => ({
        ...d,
        label: keyIndices.has(i) ? `${Math.round(d.y)}%` : "",
    }));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quiz Performance</Text>
                {totalAttempts > DEFAULT_SHOW && (
                    <TouchableOpacity
                        onPress={() => setShowAll(!showAll)}
                        style={styles.toggleBtn}
                    >
                        <Text style={styles.toggleText}>
                            {showAll ? "Show Recent" : `Show All (${totalAttempts})`}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {totalAttempts > DEFAULT_SHOW && !showAll && (
                <Text style={styles.subtitle}>
                    Showing last {DEFAULT_SHOW} of {totalAttempts} attempts
                </Text>
            )}

            <VictoryChart
                width={screenWidth}
                height={220}
                theme={VictoryTheme.material}
                padding={{ left: 50, right: 20, top: 20, bottom: 50 }}
            >
                <VictoryAxis
                    tickValues={chartData
                        .filter((_, i) => i % tickInterval === 0)
                        .map((d) => d.x)}
                    style={{
                        axisLabel: { padding: 40, fontSize: 11 },
                        tickLabels: { fontSize: 10, fill: "#999" },
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickCount={5}
                    style={{
                        axisLabel: { padding: 45, fontSize: 11 },
                        tickLabels: { fontSize: 10, fill: "#999" },
                    }}
                />
                <VictoryArea
                    data={chartData}
                    style={{
                        data: {
                            fill: "#F2B138",
                            fillOpacity: 0.2,
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
                <VictoryScatter
                    data={scatterData}
                    size={count <= 15 ? 4 : 3}
                    style={{
                        data: {
                            fill: "#F2B138",
                            stroke: "#fff",
                            strokeWidth: 1,
                        },
                    }}
                    labels={({ datum }) => datum.label}
                    labelComponent={
                        <VictoryLabel
                            style={{ fontSize: 10, fill: "#666" }}
                            dy={-10}
                        />
                    }
                />
            </VictoryChart>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2524",
    },
    subtitle: {
        fontSize: 12,
        color: "#999",
        marginBottom: 8,
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#F5F5F5",
    },
    toggleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#B8860B",
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
