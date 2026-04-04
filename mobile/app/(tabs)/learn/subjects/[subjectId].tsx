import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export default function SubjectDetailScreen() {
    const router = useRouter();
    const { subjectId, subjectCode } = useLocalSearchParams<{ subjectId: string; subjectCode?: string }>();
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;
    const subjectCodeKey = Array.isArray(subjectCode) ? subjectCode[0] : subjectCode;
    const { data: overallProgress } = useOverallProgress();

    const [subject, setSubject] = useState<Subject | null>(null);
    const [chapters, setChapters] = useState<SubjectChapter[]>([]);
    const [resolvedSubjectId, setResolvedSubjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const loadSubjectAndChapters = useCallback(async (targetSubjectId: string, targetSubjectCode?: string) => {
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

        const embeddedChapters = toSubjectChapterArray(subjectResponse.chapters);
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
            try {
                await loadSubjectAndChapters(subjectKey, subjectCodeKey);
            } catch {
                await loadFromSubjectsFallback(subjectKey, subjectCodeKey);
            }
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Subject not found.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [loadFromSubjectsFallback, loadSubjectAndChapters, router, subjectCodeKey, subjectKey]);

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
                    chapters.map((chapter, index) => {
                        const locked = isChapterLocked(chapter, index);
                        const completed = completedChapterIds.has(chapter.id);

                        return (
                            <TouchableOpacity
                                key={chapter.id}
                                style={[
                                    styles.chapterCard,
                                    locked && styles.chapterCardLocked,
                                    completed && styles.chapterCardCompleted,
                                ]}
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
                        );
                    })
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
});
