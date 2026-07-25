import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOverallProgress } from "@/lib/hooks/api";
import { SubjectProgress } from "@/lib/types";

function SubjectCard({ subject }: { subject: SubjectProgress }) {
    const router = useRouter();
    const chapters = subject.chapters as unknown as { total: number; completed: number };
    const lessons = subject.lessons as unknown as { total: number; completed: number };

    return (
        <TouchableOpacity
            style={styles.subjectCard}
            onPress={() =>
                router.push({
                    pathname: "/(tabs)/learn/subjects/[subjectId]",
                    params: { subjectId: subject.subjectId, subjectCode: subject.code },
                } as any)
            }
        >
            <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <View style={styles.progressRow}>
                    <View style={styles.progressBadge}>
                        <Ionicons name="book-outline" size={14} color="#666" />
                        <Text style={styles.progressBadgeText}>
                            {chapters.completed}/{chapters.total} chapters
                        </Text>
                    </View>
                    <View style={styles.progressBadge}>
                        <Ionicons name="document-text-outline" size={14} color="#666" />
                        <Text style={styles.progressBadgeText}>
                            {lessons.completed}/{lessons.total} lessons
                        </Text>
                    </View>
                </View>
                <View style={styles.progressBarBg}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${Math.min(subject.completionPercentage, 100)}%` },
                        ]}
                    />
                </View>
                <Text style={styles.progressPercent}>{subject.completionPercentage}% complete</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>
    );
}

export default function LearnScreen() {
    const router = useRouter();
    const { data: progressData, isLoading, error } = useOverallProgress();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading your progress...</Text>
            </View>
        );
    }

    if (error || !progressData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Failed to load progress</Text>
            </View>
        );
    }

    const subjects = progressData.subjects || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Continue Learning</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {subjects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="school-outline" size={56} color="#CCC" />
                        <Text style={styles.emptyText}>No subjects available yet.</Text>
                    </View>
                ) : (
                    subjects.map((subject) => (
                        <SubjectCard key={subject.subjectId} subject={subject} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
    errorText: { fontSize: 16, color: "#F44336" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        paddingTop: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#1F2524" },
    scrollView: { flex: 1 },
    content: { padding: 24 },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    emptyText: { marginTop: 12, fontSize: 14, color: "#999", fontWeight: "600" },
    subjectCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 12,
    },
    subjectInfo: { flex: 1, marginRight: 12 },
    subjectName: { fontSize: 16, fontWeight: "700", color: "#1F2524" },
    subjectCode: { marginTop: 2, fontSize: 12, color: "#999", fontWeight: "700" },
    progressRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    progressBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    progressBadgeText: { fontSize: 12, color: "#666" },
    progressBarBg: {
        height: 6,
        backgroundColor: "#EEE",
        borderRadius: 3,
        marginTop: 8,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#F2B138",
        borderRadius: 3,
    },
    progressPercent: { marginTop: 4, fontSize: 12, color: "#999", fontWeight: "600" },
});
