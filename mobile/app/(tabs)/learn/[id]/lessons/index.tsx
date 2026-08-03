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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { apiClient } from "@/lib/api";
import { Chapter, LessonWithProgress } from "@/lib/types";

export default function LessonsListScreen() {
    const router = useRouter();
    const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
    const chapterId = Array.isArray(id) ? id[0] : id;
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getSubjectIdFromChapter = (chapterValue: Chapter | null): string | undefined => {
        if (!chapterValue) return undefined;
        if (chapterValue.subjectId) return chapterValue.subjectId;
        const legacy = chapterValue as Chapter & { subject_id?: string };
        return legacy.subject_id;
    };

    const resolvedSubjectId = subjectKey || getSubjectIdFromChapter(chapter);

    const loadChapter = useCallback(async () => {
        if (!chapterId) return;
        try {
            const data = await apiClient.getChapter(chapterId);
            setChapter(data);
        } catch {
            // Optional, list can still render without chapter metadata.
        }
    }, [chapterId]);

    const loadLessons = useCallback(async () => {
        if (!chapterId) return;
        try {
            const data = resolvedSubjectId
                ? await apiClient.getSubjectChapterLessons(resolvedSubjectId, chapterId, true)
                : await apiClient.getChapterLessons(chapterId, true);
            setLessons(Array.isArray(data) ? (data as LessonWithProgress[]) : []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load lessons.");
        }
    }, [chapterId, resolvedSubjectId]);

    const initialize = useCallback(async () => {
        if (!chapterId) return;
        setLoading(true);
        await Promise.all([loadChapter(), loadLessons()]);
        setLoading(false);
    }, [chapterId, loadChapter, loadLessons]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useFocusEffect(
        useCallback(() => {
            if (!loading) {
                loadLessons();
            }
        }, [loading, loadLessons])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadLessons();
        setRefreshing(false);
    };

    const handleOpenLesson = (lessonId: string) => {
        if (!chapterId || !resolvedSubjectId) {
            Alert.alert("Missing Subject", "This chapter is missing its subject ID.");
            return;
        }
        router.push({
            pathname: "/(tabs)/learn/[id]/lessons/[lessonId]",
            params: {
                id: chapterId,
                lessonId,
                subjectId: resolvedSubjectId,
            },
        } as any);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading lessons...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lessons</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {chapter && (
                    <View style={styles.chapterCard}>
                        <Text style={styles.chapterTitle}>{chapter.title}</Text>
                        <Text style={styles.chapterMeta}>Chapter {chapter.orderIndex}</Text>
                    </View>
                )}

                {lessons.length === 0 ? (
                    <View style={styles.emptyLessons}>
                        <Ionicons name="book-outline" size={36} color="#CCC" />
                        <Text style={styles.emptyLessonsText}>No lessons yet.</Text>
                    </View>
                ) : (
                    lessons.map((lesson, index) => {
                        const isCompleted = lesson.isCompleted || (lesson.LessonProgress && lesson.LessonProgress.length > 0 && lesson.LessonProgress[0]?.isCompleted);
                        return (
                            <TouchableOpacity
                                key={lesson.id}
                                style={[
                                    styles.lessonCard,
                                    isCompleted && styles.lessonCardCompleted,
                                ]}
                                onPress={() => handleOpenLesson(lesson.id)}
                            >
                                <View style={styles.lessonRow}>
                                    {isCompleted ? (
                                        <View style={styles.lessonIndexCompleted}>
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                        </View>
                                    ) : (
                                        <Text style={styles.lessonIndex}>{lesson.orderIndex ?? index + 1}</Text>
                                    )}
                                    <View style={styles.lessonInfo}>
                                        <Text
                                            style={[
                                                styles.lessonTitle,
                                                isCompleted && styles.lessonTitleCompleted,
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {lesson.title || "Untitled lesson"}
                                        </Text>
                                        <Text style={styles.lessonMeta}>
                                            {lesson.durationMinutes
                                                ? `${lesson.durationMinutes} min`
                                                : "Time n/a"}
                                            {isCompleted ? " \u2022 Completed" : ""}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={isCompleted ? "#4CAF50" : "#999"} />
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#282F2E",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    chapterCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EEE",
        marginBottom: 16,
    },
    chapterTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
    },
    chapterMeta: {
        marginTop: 4,
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
    },
    emptyLessons: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 30,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    emptyLessonsText: {
        marginTop: 8,
        fontSize: 13,
        color: "#999",
        fontWeight: "600",
    },
    lessonCard: {
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
    lessonCardCompleted: {
        backgroundColor: "#E8F5E9",
        borderColor: "#4CAF50",
    },
    lessonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    lessonIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        textAlign: "center",
        textAlignVertical: "center",
        backgroundColor: "#FFF4D9",
        color: "#B87900",
        fontWeight: "700",
        fontSize: 13,
    },
    lessonIndexCompleted: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#222",
    },
    lessonTitleCompleted: {
        color: "#2E7D32",
    },
    lessonMeta: {
        marginTop: 4,
        fontSize: 12,
        color: "#777",
        fontWeight: "600",
    },
});
