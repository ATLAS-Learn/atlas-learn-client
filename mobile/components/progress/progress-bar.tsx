import { View, Text, StyleSheet } from "react-native";

interface ProgressBarProps {
    progress: number; // 0-100
}

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Overall Progress</Text>
                <Text style={styles.percentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#282F2E",
    },
    percentage: {
        fontSize: 16,
        fontWeight: "700",
        color: "#F2B138",
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: "#E0E0E0",
        borderRadius: 6,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#F2B138",
        borderRadius: 6,
    },
});
