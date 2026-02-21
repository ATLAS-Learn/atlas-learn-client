import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import { Subject } from "@/lib/types";

export default function SubjectsScreen() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSubjects = useCallback(async () => {
        try {
            const data = await apiClient.getSubjects({ includeChapters: false });
            console.log("[ID_TRACE] SubjectsScreen loaded subjects", {
                count: Array.isArray(data) ? data.length : 0,
                sample: Array.isArray(data)
                    ? data.slice(0, 3).map((item) => ({ id: item.id, code: item.code, name: item.name }))
                    : [],
            });
            setSubjects(Array.isArray(data) ? data : []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load subjects.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadSubjects();
    };

    const handleOpenSubject = (subjectId: string) => {
        console.log("[ID_TRACE] SubjectsScreen navigate subject detail", { subjectId });
        router.push({
            pathname: "/(tabs)/learn/subjects/[subjectId]",
            params: { subjectId },
        } as any);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading subjects...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subjects</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {subjects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={56} color="#CCC" />
                        <Text style={styles.emptyText}>No subjects available yet.</Text>
                    </View>
                ) : (
                    subjects.map((subject) => (
                        <TouchableOpacity
                            key={subject.id}
                            style={styles.subjectCard}
                            onPress={() => handleOpenSubject(subject.id)}
                        >
                            <View style={styles.subjectInfo}>
                                <Text style={styles.subjectTitle}>{subject.name}</Text>
                                <Text style={styles.subjectCode}>{subject.code}</Text>
                                {!!subject.description && (
                                    <Text style={styles.subjectDescription} numberOfLines={2}>
                                        {subject.description}
                                    </Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="#999" />
                        </TouchableOpacity>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#282F2E" },
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
    subjectTitle: { fontSize: 16, fontWeight: "700", color: "#1F2524" },
    subjectCode: { marginTop: 4, fontSize: 12, color: "#999", fontWeight: "700" },
    subjectDescription: { marginTop: 6, fontSize: 13, color: "#666" },
});
