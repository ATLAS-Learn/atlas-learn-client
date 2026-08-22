import React, { useCallback, useEffect, useState, useMemo } from "react";
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
import ScreenHeader from "@/components/ui/screen-header";
import { apiClient } from "@/lib/api";
import { Subject, SubjectChapter, SubjectProgress } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api";
import { getCacheSync, setCache } from "@/lib/utils/cache";

const SUBJECT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const CHAPTERS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

type ChapterStatus = "completed" | "current" | "locked";

interface ChapterWithProgress extends SubjectChapter {
    status: ChapterStatus;
    lessonProgress?: { completed: number; total: number };
    quizPassed?: boolean;
}

export default function SubjectDetailScreen() {
    const router = useRouter();
    const { subjectId, subjectCode } = useLocalSearchParams<{ subjectId: string; subjectCode?: string }>();
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;
    const subjectCodeKey = Array.isArray(subjectCode) ? subjectCode[0] : subjectCode;

    const [subject, setSubject] = useState<Subject | null>(null);
    const [chapters, setChapters] = useState<SubjectChapter[]>([]);
    const [resolvedSubjectId, setResolvedSubjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { data: progressData, refetch: refetchProgress } = useOverallProgress();

    const chaptersWithStatus = useMemo<ChapterWithProgress[]>(() => {
        if (!progressData || chapters.length === 0) return chapters as ChapterWithProgress[];

        const subjectProgress = progressData.subjects?.find(
            (s: SubjectProgress) => s.subjectId === resolvedSubjectId || s.subjectId === subjectKey
        );
        const chapterDetails = (subjectProgress?.chapterDetails || []) as {
            chapterId: string;
            isCompleted: boolean;
            isUnlocked: boolean;
            lessons?: { completed: number; total: number };
            quizzes?: { passed: number; total: number };
        }[];

        return chapters.map((chapter) => {
            const detail = chapterDetails.find((d) => d.chapterId === chapter.id);

            let status: ChapterStatus = "locked";
            if (detail?.isCompleted) {
                status = "completed";
            } else if (detail?.isUnlocked && detail?.lessons && detail.lessons.completed > 0) {
                status = "current";
            } else if (detail?.isUnlocked) {
                status = "current";
            }

            return {
                ...chapter,
                status,
                lessonProgress: detail?.lessons,
                quizPassed: detail?.quizzes ? detail.quizzes.passed > 0 : undefined,
            };
        });
    }, [chapters, progressData, resolvedSubjectId, subjectKey]);

    useEffect(() => {
        console.log("[ID_TRACE] SubjectDetail route params", {
            rawSubjectId: subjectId,
            rawSubjectCode: subjectCode,
            subjectKey,
            subjectCodeKey,
            resolvedSubjectId,
        });
    }, [resolvedSubjectId, subjectId, subjectCode, subjectKey, subjectCodeKey]);

    const toSubjectChapterArray = (value: unknown): SubjectChapter[] => {
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is SubjectChapter => Boolean(item && typeof item === "object"));
    };

    const loadFromSubjectsFallback = useCallback(async (targetSubjectId: string, targetSubjectCode?: string) => {
        const allSubjects = await apiClient.getSubjects({
            includeChapters: true,
            includeChapterDetails: true,
        });
        const code = targetSubjectCode?.trim().toUpperCase();
        const matched = allSubjects.find((item) => {
            if (code && typeof item.code === "string" && item.code.toUpperCase() === code) {
                return true;
            }
            return item.id === targetSubjectId;
        });

        if (!matched) {
            throw new Error("Subject not found");
        }

        setResolvedSubjectId(matched.id);
        setSubject(matched);
        const sorted = [...toSubjectChapterArray(matched.chapters)].sort(
            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );
        setChapters(sorted);
    }, []);

    const loadSubjectAndChapters = useCallback(async (targetSubjectId: string, targetSubjectCode?: string, force = false) => {
        console.log("[ID_TRACE] loadSubjectAndChapters", { targetSubjectId, targetSubjectCode });

        const cacheKey = `cache:subject:${targetSubjectId}`;
        const chaptersCacheKey = `cache:subject-chapters:${targetSubjectId}`;

        // Try cache first for instant display
        const cachedSubject = getCacheSync<Subject>(cacheKey);
        const cachedChapters = getCacheSync<SubjectChapter[]>(chaptersCacheKey);
        if (cachedSubject && cachedChapters && !force) {
            setResolvedSubjectId(cachedSubject.id || targetSubjectId);
            setSubject(cachedSubject);
            setChapters(cachedChapters);
            return;
        }
        if (cachedSubject && cachedChapters) {
            setResolvedSubjectId(cachedSubject.id || targetSubjectId);
            setSubject(cachedSubject);
            setChapters(cachedChapters);
        }

        let subjectResponse: Subject;
        if (targetSubjectCode) {
            subjectResponse = await apiClient.getSubjectByCode(targetSubjectCode, {
                includeChapters: true,
                includeChapterDetails: true,
            });
        } else {
            subjectResponse = await apiClient.getSubjectById(targetSubjectId, {
                includeChapters: true,
                includeChapterDetails: true,
            });
        }

        const canonicalSubjectId = subjectResponse.id || targetSubjectId;
        setResolvedSubjectId(canonicalSubjectId);
        setSubject(subjectResponse);

        setCache(cacheKey, subjectResponse, SUBJECT_CACHE_TTL).catch(() => {});

        const embeddedChapters = toSubjectChapterArray(subjectResponse.chapters);
        if (embeddedChapters.length > 0) {
            const sorted = [...embeddedChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            setChapters(sorted);
            setCache(chaptersCacheKey, sorted, CHAPTERS_CACHE_TTL).catch(() => {});
            return;
        }

        const chaptersResponse = await apiClient.getSubjectChapters(canonicalSubjectId);
        const sorted = Array.isArray(chaptersResponse)
            ? [...chaptersResponse].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            : [];
        setChapters(sorted);
        setCache(chaptersCacheKey, sorted, CHAPTERS_CACHE_TTL).catch(() => {});
    }, []);

    const initialize = useCallback(async (force = false) => {
        if (!subjectKey) return;
        setLoading(true);
        setRefreshing(false);

        const cacheKey = `cache:subject:${subjectKey}`;
        const chaptersCacheKey = `cache:subject-chapters:${subjectKey}`;
        const cachedSubject = getCacheSync<Subject>(cacheKey);
        const cachedChapters = getCacheSync<SubjectChapter[]>(chaptersCacheKey);

        // Show cache immediately if available
        if (cachedSubject && cachedChapters) {
            setResolvedSubjectId(cachedSubject.id || subjectKey);
            setSubject(cachedSubject);
            setChapters(cachedChapters);
            setLoading(false);
        }

        // Skip network when valid cache exists and not forced
        if (cachedSubject && cachedChapters && !force) {
            return;
        }

        try {
            try {
                await loadSubjectAndChapters(subjectKey, subjectCodeKey, force);
            } catch {
                await loadFromSubjectsFallback(subjectKey, subjectCodeKey);
            }
        } catch (error: any) {
            console.log("[ID_TRACE] SubjectDetail invalid subjectId", {
                subjectKey,
                subjectCodeKey,
                errorMessage: error?.message,
            });
            // If we have cached data, don't show error
            if (!cachedSubject) {
                Alert.alert("Error", error?.message || "Subject not found.");
                router.back();
            }
        } finally {
            setLoading(false);
        }
    }, [loadFromSubjectsFallback, loadSubjectAndChapters, router, subjectCodeKey, subjectKey]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleRefresh = () => {
        setRefreshing(true);
        refetchProgress();
        initialize(true);
    };

    const handleOpenChapter = (chapterId: string, status: ChapterStatus) => {
        if (status === "locked") {
            Alert.alert("Chapter Locked", "Complete the previous chapter to unlock this one.");
            return;
        }
        router.push({
            pathname: "/(tabs)/learn/[id]",
            params: { id: chapterId, subjectId: resolvedSubjectId || subjectKey || "" },
        } as any);
    };

    const getStatusIcon = (status: ChapterStatus) => {
        switch (status) {
            case "completed":
                return <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />;
            case "current":
                return <Ionicons name="play-circle" size={22} color="#F2B138" />;
            case "locked":
                return <Ionicons name="lock-closed" size={20} color="#CCC" />;
        }
    };

    const getStatusLabel = (status: ChapterStatus) => {
        switch (status) {
            case "completed":
                return "Completed";
            case "current":
                return "In Progress";
            case "locked":
                return "Not Started";
        }
    };

    const getStatusColor = (status: ChapterStatus) => {
        switch (status) {
            case "completed":
                return "#E8F5E9";
            case "current":
                return "#FFF8E1";
            case "locked":
                return "#F5F5F5";
        }
    };

    const getBorderColor = (status: ChapterStatus) => {
        switch (status) {
            case "completed":
                return "#4CAF50";
            case "current":
                return "#F2B138";
            case "locked":
                return "#EAEAEA";
        }
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
            <ScreenHeader title="Subject" />

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

                {chaptersWithStatus.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="book-outline" size={40} color="#CCC" />
                        <Text style={styles.emptyText}>No chapters yet.</Text>
                    </View>
                ) : (
                    chaptersWithStatus.map((chapter) => (
                        <TouchableOpacity
                            key={chapter.id}
                            style={[
                                styles.chapterCard,
                                {
                                    backgroundColor: getStatusColor(chapter.status),
                                    borderColor: getBorderColor(chapter.status),
                                },
                            ]}
                            onPress={() => handleOpenChapter(chapter.id, chapter.status)}
                            disabled={chapter.status === "locked"}
                        >
                            <View style={styles.chapterIconContainer}>
                                {getStatusIcon(chapter.status)}
                            </View>
                            <View style={styles.chapterInfo}>
                                <View style={styles.chapterTitleRow}>
                                    <Text
                                        style={[
                                            styles.chapterTitle,
                                            chapter.status === "locked" && styles.chapterTitleLocked,
                                        ]}
                                    >
                                        {chapter.title}
                                    </Text>
                                    <Text style={[styles.statusLabel, { color: getBorderColor(chapter.status) }]}>
                                        {getStatusLabel(chapter.status)}
                                    </Text>
                                </View>
                                {!!chapter.description && (
                                    <Text style={styles.chapterDescription} numberOfLines={2}>
                                        {chapter.description}
                                    </Text>
                                )}
                                <Text style={styles.chapterMeta}>
                                    {chapter.orderIndex ? `Chapter ${chapter.orderIndex}` : "Chapter"}
                                    {chapter.estimatedMinutes
                                        ? ` \u2022 ${chapter.estimatedMinutes} min`
                                        : ""}
                                    {chapter.lessonProgress
                                        ? ` \u2022 ${chapter.lessonProgress.completed}/${chapter.lessonProgress.total} lessons`
                                        : ""}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={chapter.status === "locked" ? "#CCC" : "#999"} />
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
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    chapterIconContainer: {
        width: 32,
        alignItems: "center",
    },
    chapterInfo: { flex: 1, marginRight: 8 },
    chapterTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chapterTitle: { fontSize: 15, fontWeight: "700", color: "#222", flex: 1 },
    chapterTitleLocked: { color: "#999" },
    statusLabel: { fontSize: 11, fontWeight: "700", marginLeft: 8 },
    chapterDescription: { marginTop: 4, fontSize: 13, color: "#666" },
    chapterMeta: { marginTop: 6, fontSize: 12, color: "#777", fontWeight: "600" },
});
