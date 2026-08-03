import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StudentListItem, StudentStatus } from "@/lib/types";

interface StudentListItemProps {
    student: StudentListItem;
    onPress: () => void;
}

const getStatusColor = (status: StudentStatus): string => {
    switch (status) {
        case StudentStatus.ON_TRACK:
            return "#4CAF50"; // Green
        case StudentStatus.BEHIND:
            return "#FF9800"; // Yellow/Orange
        case StudentStatus.AT_RISK:
            return "#E57373"; // Red
        default:
            return "#9E9E9E"; // Gray
    }
};

const getStatusLabel = (status: StudentStatus): string => {
    switch (status) {
        case StudentStatus.ON_TRACK:
            return "On Track";
        case StudentStatus.BEHIND:
            return "Behind";
        case StudentStatus.AT_RISK:
            return "At Risk";
        default:
            return "Unknown";
    }
};

export default function StudentListItemComponent({ student, onPress }: StudentListItemProps) {
    const statusColor = getStatusColor(student.status);
    const statusLabel = getStatusLabel(student.status);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                    <View style={styles.info}>
                        <Text style={styles.name}>{student.name}</Text>
                        <Text style={styles.email}>{student.email}</Text>
                        {student.currentChapterTitle && (
                            <Text style={styles.chapter}>
                                Current: {student.currentChapterTitle}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={styles.rightSection}>
                    <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                    <Text style={styles.progress}>{Math.round(student.overallProgress)}%</Text>
                    <Text style={styles.lastActive}>
                        Last active: {formatDate(student.lastActiveDate)}
                    </Text>
                </View>
            </View>
            <View style={styles.progressBarContainer}>
                <View
                    style={[
                        styles.progressBar,
                        { width: `${student.overallProgress}%`, backgroundColor: statusColor },
                    ]}
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    leftSection: {
        flexDirection: "row",
        flex: 1,
        marginRight: 12,
    },
    statusIndicator: {
        width: 4,
        height: "100%",
        borderRadius: 2,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    chapter: {
        fontSize: 12,
        color: "#999",
        marginTop: 4,
    },
    rightSection: {
        alignItems: "flex-end",
        minWidth: 100,
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    progress: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    lastActive: {
        fontSize: 11,
        color: "#999",
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: 2,
    },
});

