import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { Chapter, Lesson } from "@/lib/types";
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
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [loadingInsight, setLoadingInsight] = useState(false);
    const lastLessonsRequestKeyRef = useRef<string | null>(null);

    const getPrimaryLessonProgress = (lesson: Lesson) =>
        Array.isArray(lesson.LessonProgress) && lesson.LessonProgress.length > 0
            ? lesson.LessonProgress[0]
            : undefined;

    const loadChapter = useCallback(async () => {
        try {
            if (!chapterId) {
                throw new Error("Missing chapter ID");
            }
            const data = await apiClient.getChapter(chapterId);
            setChapter(data);
            const chapterSubjectId = getSubjectIdFromChapter(data);
            if (chapterSubjectId) {
                setResolvedSubjectId(chapterSubjectId);
            }
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
        const subjectIdForQuiz =
            resolvedSubjectId || subjectKey || getSubjectIdFromChapter(chapter);
        const params: { id: string; subjectId?: string } = { id: chapterId };
        if (subjectIdForQuiz) {
            params.subjectId = subjectIdForQuiz;
        }
        router.push({
            pathname: "/(tabs)/learn/[id]/quiz",
            params,
        } as any);
    };

    const getChapterPdfUrl = (chapterValue: Chapter | null): string | undefined => {
        if (!chapterValue) return undefined;
        const withPdf = chapterValue as Chapter & { pdfUrl?: string };
        return typeof withPdf.pdfUrl === "string" ? withPdf.pdfUrl : undefined;
    };

    const handleViewPdf = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            let pdfUrl = getChapterPdfUrl(chapter) || "";
            if (!pdfUrl && resolvedSubjectId) {
                try {
                    const subjectChapter = await apiClient.getSubjectChapter(resolvedSubjectId, chapterId);
                    pdfUrl =
                        (typeof subjectChapter?.pdfUrl === "string" && subjectChapter.pdfUrl) || "";
                } catch {
                    // Fallback to chapter endpoint below.
                }
            }
            if (!pdfUrl) {
                const pdf = await apiClient.getChapterPdf(chapterId);
                pdfUrl = typeof pdf?.url === "string" ? pdf.url : "";
            }
            if (!pdfUrl) {
                Alert.alert("No PDF", "This chapter does not have a PDF yet.");
                return;
            }
            const canOpen = await Linking.canOpenURL(pdfUrl);
            if (!canOpen) {
                Alert.alert("Unavailable", "Could not open chapter PDF.");
                return;
            }
            await Linking.openURL(pdfUrl);
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
            const requestKey = `${chapterId}:${subjectIdForRequest || "chapter-fallback"}`;
            if (lastLessonsRequestKeyRef.current === requestKey) {
                return;
            }
            lastLessonsRequestKeyRef.current = requestKey;
            const data = subjectIdForRequest
                ? await apiClient.getSubjectChapterLessons(subjectIdForRequest, chapterId, { includeProgress: true })
                : await apiClient.getChapterLessons(chapterId);
            setLessons(Array.isArray(data) ? data : []);
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

    const handleViewProgress = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const progress = await apiClient.getChapterProgress(chapterId);
            const completion = Number(progress?.completionPercentage ?? 0);
            const completed = progress?.completed ? "Yes" : "No";
            const unlocked = progress?.unlocked ? "Yes" : "No";
            Alert.alert(
                "Chapter Progress",
                `Completion: ${Math.round(completion)}%\nCompleted: ${completed}\nUnlocked: ${unlocked}`
            );
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
            if (!Array.isArray(hints) || hints.length === 0) {
                Alert.alert("Exam Hints", "No hints available yet for this chapter.");
                return;
            }
            const preview = hints
                .slice(0, 3)
                .map((hint, index) => {
                    const title = typeof hint.title === "string" && hint.title.trim() ? hint.title.trim() : `Hint ${index + 1}`;
                    const body =
                        (typeof hint.hint === "string" && hint.hint.trim()) ||
                        (typeof hint.description === "string" && hint.description.trim()) ||
                        "No details";
                    return `${index + 1}. ${title}\n${body}`;
                })
                .join("\n\n");
            const suffix = hints.length > 3 ? "\n\nOpen chapter lessons for more context." : "";
            Alert.alert("Exam Hints", `${preview}${suffix}`);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter exam hints.");
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
                <ChapterHeader chapter={chapter} />
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewPdf} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleOpenLessonsList}>
                        <Text style={styles.actionButtonText}>All Lessons</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewProgress} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewExamHints} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>Exam Hints</Text>
                    </TouchableOpacity>
                </View>

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
                    lessons.map((lesson, index) => (
                        <TouchableOpacity key={lesson.id} style={styles.lessonCard} onPress={() => handleOpenLesson(lesson.id)}>
                            <View style={styles.lessonRow}>
                                <Text style={styles.lessonIndex}>{lesson.orderIndex ?? index + 1}</Text>
                                <View style={styles.lessonInfo}>
                                    <View style={styles.lessonTitleRow}>
                                        <Text style={styles.lessonTitle} numberOfLines={2}>
                                            {lesson.title || "Untitled lesson"}
                                        </Text>
                                        {lesson.isFree ? (
                                            <View style={styles.freeBadge}>
                                                <Text style={styles.freeBadgeText}>Free</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.lessonMeta}>
                                        {lesson.estimatedMinutes
                                            ? `${lesson.estimatedMinutes} min`
                                            : lesson.durationSeconds
                                              ? `${Math.ceil(lesson.durationSeconds / 60)} min`
                                              : "Duration unavailable"}
                                    </Text>
                                    {getPrimaryLessonProgress(lesson)?.isCompleted ? (
                                        <Text style={styles.lessonProgressText}>
                                            Completed
                                            {typeof getPrimaryLessonProgress(lesson)?.timeSpent === "number"
                                                ? ` • ${Math.max(1, Math.ceil((getPrimaryLessonProgress(lesson)?.timeSpent || 0) / 60))} min spent`
                                                : ""}
                                        </Text>
                                    ) : typeof getPrimaryLessonProgress(lesson)?.timeSpent === "number" ? (
                                        <Text style={styles.lessonProgressText}>
                                            In progress • {Math.max(1, Math.ceil((getPrimaryLessonProgress(lesson)?.timeSpent || 0) / 60))} min spent
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    ))
                )}

                {(chapter.content || []).map((section) => (
                    <ContentSection key={section.id} section={section} />
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
                    <Text style={styles.quizButtonText}>Start Quiz</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

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
        color: "#F44336",
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
    lessonInfo: {
        flex: 1,
    },
    lessonTitleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    lessonTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#222",
        flex: 1,
    },
    lessonMeta: {
        marginTop: 4,
        fontSize: 12,
        color: "#777",
        fontWeight: "600",
    },
    lessonProgressText: {
        marginTop: 4,
        fontSize: 12,
        color: "#4F6B52",
        fontWeight: "600",
    },
    freeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#FFF3D6",
    },
    freeBadgeText: {
        color: "#9A6500",
        fontSize: 11,
        fontWeight: "700",
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
});
