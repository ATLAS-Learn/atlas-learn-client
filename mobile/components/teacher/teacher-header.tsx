import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TeacherDashboardData } from "@/lib/types";
import { useUserStore } from "@/lib/store/user";

interface TeacherHeaderProps {
    dashboardData: TeacherDashboardData;
}

export default function TeacherHeader({ dashboardData }: TeacherHeaderProps) {
    const { user } = useUserStore();
    const teacherName = user?.name || user?.email?.split("@")[0] || "Teacher";

    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Ionicons name="people" size={28} color="#F2B138" />
                <View>
                    <Text style={styles.title}>My Class</Text>
                    <Text style={styles.subtitle}>Welcome, {teacherName}</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardData.onTrackCount}</Text>
                    <Text style={styles.statLabel}>On Track</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
                        <Ionicons name="warning" size={24} color="#FF9800" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardData.behindCount}</Text>
                    <Text style={styles.statLabel}>Behind</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#FFEBEE" }]}>
                        <Ionicons name="alert-circle" size={24} color="#EF9A9A" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardData.atRiskCount}</Text>
                    <Text style={styles.statLabel}>At Risk</Text>
                </View>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalText}>
                    Total Students: <Text style={styles.totalNumber}>{dashboardData.totalStudents}</Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        gap: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#282F2E",
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: "#666",
        fontWeight: "600",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
    },
    statCard: {
        alignItems: "center",
        flex: 1,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "800",
        color: "#282F2E",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    totalContainer: {
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        paddingTop: 16,
    },
    totalText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    totalNumber: {
        fontWeight: "700",
        color: "#282F2E",
    },
});
