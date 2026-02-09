import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import { TeacherDashboardData, StudentListItem } from "@/lib/types";
import TeacherHeader from "@/components/teacher/teacher-header";
import StudentListItemComponent from "@/components/teacher/student-list-item";

export default function TeacherDashboardScreen() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await apiClient.getTeacherDashboard();
            setDashboardData(data);
        } catch (error: unknown) {
            console.error("Teacher dashboard error:", error);
            Alert.alert("Error", (error as Error).message || "Failed to load teacher dashboard. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const handleStudentPress = (student: StudentListItem) => {
        router.push({
            pathname: "/(tabs)/classes/students/[id]",
            params: { id: student.id },
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    if (!dashboardData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Failed to load dashboard</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
        >
            <TeacherHeader dashboardData={dashboardData} />

            <View style={styles.studentsSection}>
                <Text style={styles.sectionTitle}>Students</Text>
                {dashboardData.students.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No students found</Text>
                    </View>
                ) : (
                    dashboardData.students.map((student) => (
                        <StudentListItemComponent
                            key={student.id}
                            student={student}
                            onPress={() => handleStudentPress(student)}
                        />
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    content: {
        padding: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorText: {
        fontSize: 16,
        color: "#F44336",
    },
    studentsSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
    },
});
