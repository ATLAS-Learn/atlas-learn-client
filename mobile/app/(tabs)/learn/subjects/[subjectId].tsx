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
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import { Subject, SubjectChapter } from "@/lib/types";

export default function SubjectDetailScreen() {
    const router = useRouter();
    const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;

    const [subject, setSubject] = useState<Subject | null>(null);
    const [chapters, setChapters] = useState<SubjectChapter[]>([]);
    const [resolvedSubjectId, setResolvedSubjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        console.log("[ID_TRACE] SubjectDetail route params", {
            rawSubjectId: subjectId,
            subjectKey,
            resolvedSubjectId,
        });
    }, [resolvedSubjectId, subjectId, subjectKey]);

    const loadSubjectAndChapters = useCallback(async (targetSubjectId: string) => {
        console.log("[ID_TRACE] loadSubjectAndChapters", { targetSubjectId });
        const subjectResponse = await apiClient.getSubjectById(targetSubjectId, { includeChapters: false });
        const chaptersResponse = await apiClient.getSubjectChapters(targetSubjectId);
        setResolvedSubjectId(targetSubjectId);
        setSubject(subjectResponse);
        const sorted = Array.isArray(chaptersResponse)
            ? [...chaptersResponse].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            : [];
        setChapters(sorted);
    }, []);

    const initialize = useCallback(async () => {
        if (!subjectKey) return;
        setLoading(true);
        setRefreshing(false);
        try {
            await loadSubjectAndChapters(subjectKey);
        } catch (error: any) {
            console.log("[ID_TRACE] SubjectDetail invalid subjectId", {
                subjectKey,
                errorMessage: error?.message,
            });
            Alert.alert("Error", error?.message || "Subject not found.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [loadSubjectAndChapters, router, subjectKey]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleRefresh = () => {
        setRefreshing(true);
        initialize();
    };

    const handleOpenChapter = (chapterId: string) => {
        router.push({
            pathname: "/(tabs)/learn/[id]",
            params: { id: chapterId, subjectId: resolvedSubjectId || subjectKey || "" },
        } as any);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading subject...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subject</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {subject && (
                    <View style={styles.subjectCard}>
                        <Text style={styles.subjectTitle}>{subject.name}</Text>
                        <Text style={styles.subjectCode}>{subject.code}</Text>
                        {!!subject.description && (
                            <Text style={styles.subjectDescription}>{subject.description}</Text>
                        )}
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Chapters</Text>
                    <Text style={styles.sectionCount}>{chapters.length} total</Text>
                </View>

                {chapters.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="book-outline" size={40} color="#CCC" />
                        <Text style={styles.emptyText}>No chapters yet.</Text>
                    </View>
                ) : (
                    chapters.map((chapter) => (
                        <TouchableOpacity
                            key={chapter.id}
                            style={styles.chapterCard}
                            onPress={() => handleOpenChapter(chapter.id)}
                        >
                            <View style={styles.chapterInfo}>
                                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                {!!chapter.description && (
                                    <Text style={styles.chapterDescription} numberOfLines={2}>
                                        {chapter.description}
                                    </Text>
                                )}
                                <Text style={styles.chapterMeta}>
                                    {chapter.orderIndex ? `Chapter ${chapter.orderIndex}` : "Chapter"}
                                    {chapter.estimatedMinutes
                                        ? ` • ${chapter.estimatedMinutes} min`
                                        : ""}
                                </Text>
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
    subjectCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EEE",
        marginBottom: 20,
    },
    subjectTitle: { fontSize: 18, fontWeight: "700", color: "#1F2524" },
    subjectCode: { marginTop: 4, fontSize: 12, color: "#999", fontWeight: "700" },
    subjectDescription: { marginTop: 8, fontSize: 14, color: "#666" },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#282F2E" },
    sectionCount: { fontSize: 12, color: "#666", fontWeight: "600" },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 30,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    emptyText: { marginTop: 8, fontSize: 13, color: "#999", fontWeight: "600" },
    chapterCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 10,
    },
    chapterInfo: { flex: 1, marginRight: 12 },
    chapterTitle: { fontSize: 15, fontWeight: "700", color: "#222" },
    chapterDescription: { marginTop: 4, fontSize: 13, color: "#666" },
    chapterMeta: { marginTop: 6, fontSize: 12, color: "#777", fontWeight: "600" },
});
