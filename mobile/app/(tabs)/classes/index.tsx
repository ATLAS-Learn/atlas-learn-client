import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StudentListItem, StudentStatus, Level } from "@/lib/types";
import TeacherHeader from "@/components/teacher/teacher-header";
import StudentListItemComponent from "@/components/teacher/student-list-item";
import { useTeacherDashboard } from "@/lib/hooks/api";
import StudentProgressChart from "@/components/charts/StudentProgressChart";

type ProgressFilter = "all" | "0-25" | "25-50" | "50-75" | "75-100";
type LevelFilter = "all" | Level;
type StatusFilter = "all" | StudentStatus;

export default function TeacherDashboardScreen() {
    const router = useRouter();
    const { data: dashboardData, isLoading, refetch, isRefetching } = useTeacherDashboard();
    const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [showFilters, setShowFilters] = useState(false);

    const handleRefresh = () => {
        refetch();
    };

    const handleStudentPress = (student: StudentListItem) => {
        router.push({
            pathname: "/(tabs)/classes/students/[id]",
            params: { id: student.id },
        } as any);
    };

    const filteredStudents = useMemo(() => {
        if (!dashboardData) return [];

        let filtered = [...dashboardData.students];

        // Filter by progress
        if (progressFilter !== "all") {
            const [min, max] = progressFilter.split("-").map(Number);
            filtered = filtered.filter((student) => {
                const progress = student.overallProgress;
                return progress >= min && progress <= max;
            });
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((student) => student.status === statusFilter);
        }

        return filtered;
    }, [dashboardData, progressFilter, statusFilter]);

    const getProgressFilterLabel = (filter: ProgressFilter): string => {
        switch (filter) {
            case "all":
                return "All Progress";
            case "0-25":
                return "0-25%";
            case "25-50":
                return "25-50%";
            case "50-75":
                return "50-75%";
            case "75-100":
                return "75-100%";
        }
    };

    const getStatusFilterLabel = (filter: StatusFilter): string => {
        switch (filter) {
            case "all":
                return "All Status";
            case StudentStatus.ON_TRACK:
                return "On Track";
            case StudentStatus.BEHIND:
                return "Behind";
            case StudentStatus.AT_RISK:
                return "At Risk";
        }
    };

    if (isLoading) {
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
                <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
            }
        >
            <TeacherHeader dashboardData={dashboardData} />

            {dashboardData.students.length > 0 && (
                <StudentProgressChart students={dashboardData.students} />
            )}

            <View style={styles.filtersSection}>
                <View style={styles.filtersHeader}>
                    <Text style={styles.sectionTitle}>Students</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Ionicons
                            name={showFilters ? "filter" : "filter-outline"}
                            size={20}
                            color="#F2B138"
                        />
                        <Text style={styles.filterButtonText}>Filter</Text>
                    </TouchableOpacity>
                </View>

                {showFilters && (
                    <View style={styles.filtersContainer}>
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Progress</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                                {(["all", "0-25", "25-50", "50-75", "75-100"] as ProgressFilter[]).map((filter) => (
                                    <TouchableOpacity
                                        key={filter}
                                        style={[
                                            styles.filterChip,
                                            progressFilter === filter && styles.filterChipActive,
                                        ]}
                                        onPress={() => setProgressFilter(filter)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                progressFilter === filter && styles.filterChipTextActive,
                                            ]}
                                        >
                                            {getProgressFilterLabel(filter)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                                {(["all", StudentStatus.ON_TRACK, StudentStatus.BEHIND, StudentStatus.AT_RISK] as StatusFilter[]).map((filter) => (
                                    <TouchableOpacity
                                        key={filter}
                                        style={[
                                            styles.filterChip,
                                            statusFilter === filter && styles.filterChipActive,
                                        ]}
                                        onPress={() => setStatusFilter(filter)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                statusFilter === filter && styles.filterChipTextActive,
                                            ]}
                                        >
                                            {getStatusFilterLabel(filter)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {(progressFilter !== "all" || statusFilter !== "all") && (
                            <TouchableOpacity
                                style={styles.clearFiltersButton}
                                onPress={() => {
                                    setProgressFilter("all");
                                    setStatusFilter("all");
                                }}
                            >
                                <Ionicons name="close-circle" size={16} color="#F44336" />
                                <Text style={styles.clearFiltersText}>Clear Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.studentsSection}>
                {filteredStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>
                            {dashboardData.students.length === 0
                                ? "No students found"
                                : "No students match the selected filters"}
                        </Text>
                        {(progressFilter !== "all" || statusFilter !== "all") && (
                            <TouchableOpacity
                                style={styles.clearFiltersLink}
                                onPress={() => {
                                    setProgressFilter("all");
                                    setStatusFilter("all");
                                }}
                            >
                                <Text style={styles.clearFiltersLinkText}>Clear filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <>
                        <Text style={styles.resultsCount}>
                            Showing {filteredStudents.length} of {dashboardData.students.length} students
                        </Text>
                        {filteredStudents.map((student) => (
                            <StudentListItemComponent
                                key={student.id}
                                student={student}
                                onPress={() => handleStudentPress(student)}
                            />
                        ))}
                    </>
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
    filtersSection: {
        marginTop: 8,
        marginBottom: 16,
    },
    filtersHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#282F2E",
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#F2B138",
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#F2B138",
    },
    filtersContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    filterGroup: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
    },
    filterChips: {
        flexDirection: "row",
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    filterChipActive: {
        backgroundColor: "#FFF9E6",
        borderColor: "#F2B138",
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
    },
    filterChipTextActive: {
        color: "#F2B138",
        fontWeight: "700",
    },
    clearFiltersButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 8,
        marginTop: 8,
    },
    clearFiltersText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#F44336",
    },
    studentsSection: {
        marginTop: 8,
    },
    resultsCount: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
        fontWeight: "500",
    },
    emptyContainer: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
        marginTop: 12,
        textAlign: "center",
    },
    clearFiltersLink: {
        marginTop: 12,
    },
    clearFiltersLinkText: {
        fontSize: 14,
        color: "#F2B138",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
});
