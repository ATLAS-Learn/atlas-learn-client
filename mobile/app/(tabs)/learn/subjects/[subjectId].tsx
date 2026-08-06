<<<<<<< HEAD
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
=======
import React, { useCallback, useEffect, useState, useMemo } from "react";
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
import {
    ActivityIndicator,
    Alert,
    Animated,
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
<<<<<<< HEAD
import { Subject, SubjectChapter } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api/useProgress";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
    value && typeof value === "object" ? (value as UnknownRecord) : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const getString = (record: UnknownRecord, keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
};

const getBoolean = (record: UnknownRecord, keys: string[]): boolean =>
    keys.some((key) => record[key] === true);
=======
import { Subject, SubjectChapter, SubjectProgress } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api";

type ChapterStatus = "completed" | "current" | "locked";

interface ChapterWithProgress extends SubjectChapter {
    status: ChapterStatus;
    lessonProgress?: { completed: number; total: number };
    quizPassed?: boolean;
}
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906

export default function SubjectDetailScreen() {
    const router = useRouter();
    const { subjectId, subjectCode, highlightChapterId, fromChapterId, highlightUnlocked } = useLocalSearchParams<{
        subjectId: string;
        subjectCode?: string;
        highlightChapterId?: string;
        fromChapterId?: string;
        highlightUnlocked?: string;
    }>();
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;
    const subjectCodeKey = Array.isArray(subjectCode) ? subjectCode[0] : subjectCode;
    const explicitHighlightedChapterId = Array.isArray(highlightChapterId) ? highlightChapterId[0] : highlightChapterId;
    const fromChapterKey = Array.isArray(fromChapterId) ? fromChapterId[0] : fromChapterId;
    const shouldHighlightUnlocked = (Array.isArray(highlightUnlocked) ? highlightUnlocked[0] : highlightUnlocked) === "true";
    const { data: overallProgress } = useOverallProgress();
    const scrollViewRef = useRef<ScrollView | null>(null);
    const chapterOffsetsRef = useRef<Record<string, number>>({});
    const highlightAnimation = useRef(new Animated.Value(0)).current;

    const [subject, setSubject] = useState<Subject | null>(null);
    const [chapters, setChapters] = useState<SubjectChapter[]>([]);
    const [resolvedSubjectId, setResolvedSubjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
<<<<<<< HEAD
    const [activeHighlightChapterId, setActiveHighlightChapterId] = useState<string | null>(null);
=======
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
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906

    const toSubjectChapterArray = (value: unknown): SubjectChapter[] => {
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is SubjectChapter => Boolean(item && typeof item === "object"));
    };

    const loadSubjectAndChapters = useCallback(async (targetSubjectId: string, targetSubjectCode?: string) => {
        const allSubjects = await apiClient.getSubjects({
            includeChapters: true,
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

        const canonicalSubjectId = matched.id || targetSubjectId;
        setResolvedSubjectId(canonicalSubjectId);
        setSubject(matched);

        const embeddedChapters = toSubjectChapterArray(matched.chapters);
        if (embeddedChapters.length > 0) {
            const sorted = [...embeddedChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            setChapters(sorted);
            return;
        }

        const chaptersResponse = await apiClient.getSubjectChapters(canonicalSubjectId);
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
            await loadSubjectAndChapters(subjectKey, subjectCodeKey);
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Subject not found.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [loadSubjectAndChapters, router, subjectCodeKey, subjectKey]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleRefresh = () => {
        setRefreshing(true);
        refetchProgress();
        initialize();
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

<<<<<<< HEAD
    const completedChapterIds = useMemo((): Set<string> => {
        const activeSubjectId = resolvedSubjectId || subjectKey;
        if (!activeSubjectId || !Array.isArray(overallProgress?.subjects)) {
            return new Set();
        }

        const subjectProgress = overallProgress.subjects.find((entry) => entry.subjectId === activeSubjectId);
        if (!subjectProgress) {
            return new Set();
        }

        const completedIds = new Set<string>();

        asArray(subjectProgress.chapterDetails).forEach((entry) => {
            const record = asRecord(entry);
            if (!record || !getBoolean(record, ["completed", "isCompleted"])) {
                return;
            }

            const chapterIdValue = getString(record, ["chapterId", "id"]);
            if (chapterIdValue) {
                completedIds.add(chapterIdValue);
            }
        });

        const chaptersRecord = asRecord(subjectProgress.chapters);
        if (chaptersRecord) {
            Object.entries(chaptersRecord).forEach(([chapterIdValue, value]) => {
                const record = asRecord(value);
                if (record && getBoolean(record, ["completed", "isCompleted"])) {
                    completedIds.add(chapterIdValue);
                }
            });
        }

        return completedIds;
    }, [overallProgress?.subjects, resolvedSubjectId, subjectKey]);

    const isChapterLocked = useCallback(
        (chapter: SubjectChapter, index: number): boolean => {
            if (index === 0) return false;

            const chapterRecord = chapter as UnknownRecord;
            if (getBoolean(chapterRecord, ["unlocked", "isUnlocked"])) {
                return false;
            }

            const previousChapter = chapters[index - 1];
            return previousChapter ? !completedChapterIds.has(previousChapter.id) : false;
        },
        [chapters, completedChapterIds]
    );

    const derivedHighlightedChapterId = useMemo(() => {
        if (explicitHighlightedChapterId && chapters.some((chapter) => chapter.id === explicitHighlightedChapterId)) {
            return explicitHighlightedChapterId;
        }
        if (!shouldHighlightUnlocked || !fromChapterKey) {
            return undefined;
        }
        const currentIndex = chapters.findIndex((chapter) => chapter.id === fromChapterKey);
        if (currentIndex < 0 || currentIndex >= chapters.length - 1) {
            return undefined;
        }
        return chapters[currentIndex + 1]?.id;
    }, [chapters, explicitHighlightedChapterId, fromChapterKey, shouldHighlightUnlocked]);

    useEffect(() => {
        if (!derivedHighlightedChapterId || !chapters.some((chapter) => chapter.id === derivedHighlightedChapterId)) {
            return;
        }

        setActiveHighlightChapterId(derivedHighlightedChapterId);
        highlightAnimation.setValue(1);

        const scrollTimeout = setTimeout(() => {
            const offsetY = chapterOffsetsRef.current[derivedHighlightedChapterId];
            if (typeof offsetY === "number") {
                scrollViewRef.current?.scrollTo({
                    y: Math.max(0, offsetY - 24),
                    animated: true,
                });
            }
        }, 150);

        const pulseAnimation = Animated.sequence([
            Animated.timing(highlightAnimation, {
                toValue: 0.25,
                duration: 700,
                useNativeDriver: false,
            }),
            Animated.timing(highlightAnimation, {
                toValue: 1,
                duration: 700,
                useNativeDriver: false,
            }),
        ]);

        const loop = Animated.loop(pulseAnimation);
        loop.start();

        const clearTimeoutId = setTimeout(() => {
            loop.stop();
            setActiveHighlightChapterId(null);
            highlightAnimation.setValue(0);
        }, 4200);

        return () => {
            clearTimeout(scrollTimeout);
            clearTimeout(clearTimeoutId);
            loop.stop();
        };
    }, [chapters, derivedHighlightedChapterId, highlightAnimation]);
=======
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
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906

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
                ref={scrollViewRef}
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
<<<<<<< HEAD
                    chapters.map((chapter, index) => {
                        const locked = isChapterLocked(chapter, index);
                        const completed = completedChapterIds.has(chapter.id);
                        const isHighlighted = activeHighlightChapterId === chapter.id;
                        const highlightedBackground = highlightAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["#FFFFFF", "#FDE7A8"],
                        });
                        const highlightedBorder = highlightAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["#EAEAEA", "#BF522A"],
                        });
                        const highlightedScale = highlightAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.015],
                        });

                        return (
                            <Animated.View
                                key={chapter.id}
                                style={[
                                    styles.chapterCard,
                                    locked && styles.chapterCardLocked,
                                    completed && styles.chapterCardCompleted,
                                    isHighlighted && {
                                        transform: [{ scale: highlightedScale }],
                                        shadowColor: "#BF522A",
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.18,
                                        shadowRadius: 18,
                                        elevation: 6,
                                    },
                                    isHighlighted && {
                                        backgroundColor: highlightedBackground,
                                        borderColor: highlightedBorder,
                                    },
                                ]}
                                onLayout={(event) => {
                                    chapterOffsetsRef.current[chapter.id] = event.nativeEvent.layout.y;
                                }}
                            >
                                <TouchableOpacity
                                    style={styles.chapterTapArea}
                                    onPress={() => !locked && handleOpenChapter(chapter.id)}
                                    disabled={locked}
                                >
                                    <View style={styles.chapterInfo}>
                                        <View style={styles.chapterTitleRow}>
                                            <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                            {completed ? (
                                                <View style={styles.completedBadge}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                                                    <Text style={styles.completedText}>Completed</Text>
                                                </View>
                                            ) : null}
                                            {locked ? (
                                                <View style={styles.lockedBadge}>
                                                    <Ionicons name="lock-closed" size={14} color="#999" />
                                                    <Text style={styles.lockedText}>Locked</Text>
                                                </View>
                                            ) : null}
                                            {isHighlighted ? (
                                                <View style={styles.unlockedBadge}>
                                                    <Ionicons name="sparkles" size={14} color="#8A5D00" />
                                                    <Text style={styles.unlockedText}>Just unlocked</Text>
                                                </View>
                                            ) : null}
                                        </View>
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
                                    {!locked ? <Ionicons name="chevron-forward" size={22} color="#999" /> : null}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })
=======
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
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
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
<<<<<<< HEAD
        backgroundColor: "#fff",
=======
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
<<<<<<< HEAD
    chapterTapArea: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
    },
    chapterCardLocked: {
        opacity: 0.72,
        backgroundColor: "#F5F5F5",
        borderColor: "#E2E2E2",
    },
    chapterCardCompleted: {
        backgroundColor: "#F8FFF6",
        borderColor: "#DCEFD8",
    },
    chapterInfo: { flex: 1, marginRight: 12 },
    chapterTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    chapterTitle: { flexShrink: 1, fontSize: 15, fontWeight: "700", color: "#222" },
=======
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
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
    chapterDescription: { marginTop: 4, fontSize: 13, color: "#666" },
    chapterMeta: { marginTop: 6, fontSize: 12, color: "#777", fontWeight: "600" },
    completedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#E9F7E6",
    },
    completedText: { fontSize: 11, fontWeight: "700", color: "#2E7D32" },
    lockedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#ECECEC",
    },
    lockedText: { fontSize: 11, fontWeight: "700", color: "#777" },
    unlockedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#FDE7A8",
    },
    unlockedText: { fontSize: 11, fontWeight: "700", color: "#8A5D00" },
});
