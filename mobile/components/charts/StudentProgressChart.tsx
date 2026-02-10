import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme } from "victory-native";
import { StudentListItem } from "@/lib/types";

interface StudentProgressChartProps {
    students: StudentListItem[];
}

export default function StudentProgressChart({ students }: StudentProgressChartProps) {
    if (students.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No students to display</Text>
            </View>
        );
    }

    // Group students by progress ranges
    const progressRanges = {
        "0-25%": students.filter((s) => s.overallProgress >= 0 && s.overallProgress <= 25).length,
        "26-50%": students.filter((s) => s.overallProgress >= 26 && s.overallProgress <= 50).length,
        "51-75%": students.filter((s) => s.overallProgress >= 51 && s.overallProgress <= 75).length,
        "76-100%": students.filter((s) => s.overallProgress >= 76 && s.overallProgress <= 100).length,
    };

    const chartData = Object.entries(progressRanges).map(([range, count], index) => ({
        x: range,
        y: count,
        label: count > 0 ? count.toString() : "",
    }));

    const screenWidth = Dimensions.get("window").width - 48;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Students by Progress Range</Text>
            <VictoryChart
                width={screenWidth}
                height={220}
                theme={VictoryTheme.material}
                padding={{ left: 50, right: 20, top: 20, bottom: 60 }}
            >
                <VictoryAxis
                    label="Progress Range"
                    style={{
                        axisLabel: { padding: 50, fontSize: 12 },
                        tickLabels: { fontSize: 10, angle: -45, textAnchor: "end" },
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    label="Number of Students"
                    style={{
                        axisLabel: { padding: 40, fontSize: 12 },
                        tickLabels: { fontSize: 10 },
                    }}
                />
                <VictoryBar
                    data={chartData}
                    style={{
                        data: {
                            fill: "#F2B138",
                            width: 40,
                        },
                        labels: {
                            fontSize: 12,
                            fill: "#282F2E",
                        },
                    }}
                    labels={({ datum }) => datum.label}
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
