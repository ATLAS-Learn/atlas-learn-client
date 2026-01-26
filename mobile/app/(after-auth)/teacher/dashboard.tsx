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
import { apiClient } from "@/services/api";
import { TeacherDashboardData, StudentListItem, StudentStatus } from "@/services/types";
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
        } catch (error: any) {
            console.error("Teacher dashboard error:", error);
            // For now, use mock data if API is not available
            // This allows us to see the visuals even if backend is not ready
            const mockData: TeacherDashboardData = {
                students: [
                    {
                        id: "1",
                        name: "John Doe",
                        email: "john.doe@example.com",
                        status: StudentStatus.ON_TRACK,
                        currentChapterId: "ch1",
                        currentChapterTitle: "Introduction to Programming",
                        overallProgress: 85,
                        lastActiveDate: new Date().toISOString(),
                    },
                    {
                        id: "2",
                        name: "Jane Smith",
                        email: "jane.smith@example.com",
                        status: StudentStatus.BEHIND,
                        currentChapterId: "ch2",
                        currentChapterTitle: "Data Structures",
                        overallProgress: 45,
                        lastActiveDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                    {
                        id: "3",
                        name: "Bob Johnson",
                        email: "bob.johnson@example.com",
                        status: StudentStatus.AT_RISK,
                        currentChapterId: "ch1",
                        currentChapterTitle: "Introduction to Programming",
                        overallProgress: 20,
                        lastActiveDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                ],
                totalStudents: 3,
                onTrackCount: 1,
                behindCount: 1,
                atRiskCount: 1,
            };
            setDashboardData(mockData);
            // Don't show error alert for now, just use mock data
            // Alert.alert("Error", "Failed to load teacher dashboard. Please try again.");
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
            pathname: "/(after-auth)/teacher/students/[id]",
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

