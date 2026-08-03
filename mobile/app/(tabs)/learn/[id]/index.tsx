import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { Chapter, Lesson, LessonWithProgress } from "@/lib/types";
import ChapterHeader from "@/components/lessons/chapter-header";
import ContentSection from "@/components/lessons/content-section";

export default function ChapterScreen() {
    const router = useRouter();
    const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId?: string }>();
    const chapterId = Array.isArray(id) ? id[0] : id;
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [resolvedSubjectId, setResolvedSubjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [insightModalVisible, setInsightModalVisible] = useState(false);
    const [insightTitle, setInsightTitle] = useState("");
    const [insightBody, setInsightBody] = useState("");
    const [loadingInsight, setLoadingInsight] = useState(false);

    useEffect(() => {
        console.log("[ID_TRACE] ChapterScreen route params", {
            rawId: id,
            rawSubjectId: subjectId,
            chapterId,
            subjectKey,
        });
    }, [chapterId, id, subjectId, subjectKey]);

    const loadChapter = useCallback(async () => {
        try {
            if (!chapterId) {
                throw new Error("Missing chapter ID");
            }
            const data = await apiClient.getChapter(chapterId);
            setChapter(data);
        } catch {
            Alert.alert("Error", "Failed to load chapter. Please try again.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [chapterId, router]);

    useEffect(() => {
        if (chapterId) {
            loadChapter();
        } else {
            setLoading(false);
        }
    }, [chapterId, loadChapter]);

    const handleStartQuiz = () => {
        if (!chapterId) return;
        const subjectIdForRoute = resolvedSubjectId || subjectKey || getSubjectIdFromChapter(chapter);
        router.push({
            pathname: `/(tabs)/learn/${chapterId}/quiz`,
            params: { subjectId: subjectIdForRoute || "" },
        } as any);
    };

    const showInsight = (title: string, data: unknown) => {
        setInsightTitle(title);
        setInsightBody(JSON.stringify(data, null, 2));
        setInsightModalVisible(true);
    };

    const handleViewPdf = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const pdf = await apiClient.getChapterPdf(chapterId);
            showInsight("Chapter PDF", pdf);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter PDF.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const getSubjectIdFromChapter = (chapterValue: Chapter | null): string | undefined => {
        if (!chapterValue) return undefined;
        if (chapterValue.subjectId) return chapterValue.subjectId;
        const legacy = chapterValue as Chapter & { subject_id?: string };
        return legacy.subject_id;
    };

    const resolveSubjectIdFromSubjects = useCallback(async (targetChapterId: string): Promise<string | undefined> => {
        const subjects = await apiClient.getSubjects({ includeChapters: true });
        for (const subject of subjects) {
            if (!Array.isArray(subject?.chapters)) continue;
            const matched = subject.chapters.some((entry) => {
                if (!entry || typeof entry !== "object") return false;
                const chapterEntry = entry as { id?: string };
                return chapterEntry.id === targetChapterId;
            });
            if (matched) {
                return subject.id;
            }
        }
        return undefined;
    }, []);

    const loadLessons = useCallback(async () => {
        if (!chapterId) return;
        setLessonsLoading(true);
        try {
            let subjectIdForRequest =
                resolvedSubjectId || subjectKey || getSubjectIdFromChapter(chapter);
            if (!subjectIdForRequest) {
                subjectIdForRequest = await resolveSubjectIdFromSubjects(chapterId);
                if (subjectIdForRequest) {
                    setResolvedSubjectId(subjectIdForRequest);
                }
            }
            console.log("[ID_TRACE] ChapterScreen loadLessons resolved IDs", {
                chapterId,
                subjectKey,
                chapterSubjectId: getSubjectIdFromChapter(chapter),
                resolvedSubjectId: subjectIdForRequest,
            });
            const data = subjectIdForRequest
                ? await apiClient.getSubjectChapterLessons(subjectIdForRequest, chapterId, true)
                : await apiClient.getChapterLessons(chapterId, true);
            setLessons(Array.isArray(data) ? (data as LessonWithProgress[]) : []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter lessons.");
        } finally {
            setLessonsLoading(false);
        }
    }, [chapter, chapterId, resolvedSubjectId, resolveSubjectIdFromSubjects, subjectKey]);

    useEffect(() => {
        if (chapterId && chapter) {
            loadLessons();
        }
    }, [chapter, chapterId, loadLessons]);

    useFocusEffect(
        useCallback(() => {
            if (chapter && !loading) {
                loadLessons();
            }
        }, [chapter, loading, loadLessons])
    );

    const handleViewProgress = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const progress = await apiClient.getChapterProgress(chapterId);
            showInsight("Chapter Progress", progress);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter progress.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const handleViewExamHints = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const hints = await apiClient.getChapterExamHints(chapterId);
            showInsight("Chapter Exam Hints", hints);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter exam hints.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const handleUnlockChapter = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const result = await apiClient.unlockChapter(chapterId);
            showInsight("Unlock Chapter", result);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to unlock chapter.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const handleOpenLesson = (lessonId: string) => {
        if (!chapterId) return;
        const subjectIdForRoute = resolvedSubjectId || subjectKey || getSubjectIdFromChapter(chapter);
        if (!subjectIdForRoute) {
            Alert.alert("Missing Subject", "This chapter is missing its subject ID.");
            return;
        }
        router.push({
            pathname: "/(tabs)/learn/[id]/lessons/[lessonId]",
            params: {
                id: chapterId,
                lessonId,
                subjectId: subjectIdForRoute,
            },
        } as any);
    };

    const handleOpenLessonsList = () => {
        if (!chapterId) return;
        const subjectId = resolvedSubjectId || subjectKey || getSubjectIdFromChapter(chapter);
        router.push({
            pathname: "/(tabs)/learn/[id]/lessons",
            params: {
                id: chapterId,
                subjectId: subjectId || "",
            },
        } as any);
    };

    useEffect(() => {
        if (resolvedSubjectId) return;
        const fromRouteOrChapter = subjectKey || getSubjectIdFromChapter(chapter);
        if (fromRouteOrChapter) {
            setResolvedSubjectId(fromRouteOrChapter);
        }
    }, [chapter, resolvedSubjectId, subjectKey]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading chapter...</Text>
            </View>
        );
    }

    if (!chapter) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Chapter not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chapter</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <ChapterHeader chapter={chapter} lessons={lessons} />

                <View style={styles.lessonsHeader}>
                    <View>
                        <Text style={styles.lessonsTitle}>Lessons</Text>
                        <Text style={styles.lessonsCount}>{lessons.length} total</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={loadLessons}
                        disabled={lessonsLoading}
                    >
                        <Ionicons name="refresh" size={16} color="#8A5D00" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                {lessonsLoading ? (
                    <View style={styles.lessonLoading}>
                        <ActivityIndicator size="small" color="#F2B138" />
                        <Text style={styles.lessonLoadingText}>Loading lessons...</Text>
                    </View>
                ) : lessons.length === 0 ? (
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

            <View style={styles.footer}>
                <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
                    <Text style={styles.quizButtonText}>Start Quiz</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={insightModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setInsightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{insightTitle}</Text>
                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.modalBody}>{insightBody || "No data."}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.quizButton} onPress={() => setInsightModalVisible(false)}>
                            <Text style={styles.quizButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    errorText: {
        fontSize: 16,
        color: "#E57373",
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
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },
    actionButton: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#fff",
    },
    actionButtonText: {
        fontSize: 12,
        color: "#333",
        fontWeight: "700",
    },
    lessonsHeader: {
        marginTop: 10,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    lessonsTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
    },
    lessonsCount: {
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FFF8E8",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#F5E5BE",
    },
    refreshButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#8A5D00",
    },
    lessonLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
    },
    lessonLoadingText: {
        fontSize: 13,
        color: "#666",
    },
    emptyLessons: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        marginBottom: 12,
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
    footer: {
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    quizButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    quizButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        maxHeight: "85%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 10,
    },
    modalScroll: {
        maxHeight: 320,
        marginBottom: 12,
    },
    modalBody: {
        fontSize: 12,
        color: "#444",
        lineHeight: 18,
    },
});
