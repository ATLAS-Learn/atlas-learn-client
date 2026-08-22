import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ui/screen-header";
import { apiClient } from "@/lib/api";
import { Chapter } from "@/lib/types";
import { useUserStore } from "@/lib/store/user";
import { getCacheSync, setCache } from "@/lib/utils/cache";

const CHAPTERS_CACHE_KEY = "cache:chapters:list";
const CHAPTERS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const LESSON_COUNTS_CACHE_KEY = "cache:chapters:lessonCounts";
const LESSON_COUNTS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function ChaptersListScreen() {
    const router = useRouter();
    const { user } = useUserStore();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
    const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadChapters();
    }, []);

    const loadChapters = async (force = false) => {
        try {
            // Fetch-once: skip ALL network calls when valid cache exists
            const cachedChapters = getCacheSync<Chapter[]>(CHAPTERS_CACHE_KEY);
            const cachedCounts = getCacheSync<Record<string, number>>(LESSON_COUNTS_CACHE_KEY);
            if (cachedChapters && !force) {
                setChapters(cachedChapters);
                setLessonCounts(cachedCounts || {});
                setLoading(false);
                return;
            }

            // Fetch fresh data from server
            const [data, progressData] = await Promise.all([
                apiClient.getChapters(),
                apiClient.getOverallProgress(),
            ]);

            const sortedAllChapters = [...data].sort((a, b) => a.orderIndex - b.orderIndex);
            const completedCount = Math.max(
                0,
                Math.min(progressData?.overall?.chapters?.completed || 0, sortedAllChapters.length)
            );
            const completedChapterIds = new Set<string>(
                sortedAllChapters.slice(0, completedCount).map((chapter) => chapter.id)
            );

            // Filter chapters by user level if set
            let filteredChapters = data;
            // Sort by orderIndex
            filteredChapters.sort((a, b) => a.orderIndex - b.orderIndex);
            setChapters(filteredChapters);
            setCompletedChapters(completedChapterIds);

            // Cache chapters
            setCache(CHAPTERS_CACHE_KEY, filteredChapters, CHAPTERS_CACHE_TTL).catch(() => {});

            // Fetch lesson counts for each chapter in parallel
            const counts: Record<string, number> = {};
            await Promise.all(
                filteredChapters.map(async (chapter) => {
                    try {
                        const lessons = await apiClient.getChapterLessons(chapter.id);
                        counts[chapter.id] = lessons.length;
                    } catch {
                        counts[chapter.id] = 0;
                    }
                })
            );
            setLessonCounts(counts);
            setCache(LESSON_COUNTS_CACHE_KEY, counts, LESSON_COUNTS_CACHE_TTL).catch(() => {});
        } catch (error: any) {
            // If we have cached data, don't show error
            const cached = getCacheSync<Chapter[]>(CHAPTERS_CACHE_KEY);
            if (!cached) {
                Alert.alert("Error", error.message || "Failed to load chapters. Please try again.");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadChapters(true);
    };

    const handleChapterPress = (chapterId: string) => {
        router.push(`/(tabs)/learn/${chapterId}`);
    };

    const isChapterCompleted = (chapterId: string): boolean => {
        return completedChapters.has(chapterId);
    };

    const isChapterLocked = (chapter: Chapter, index: number): boolean => {
        // First chapter is never locked
        if (index === 0) return false;
        // Chapter is locked if previous chapter is not completed
        const previousChapter = chapters[index - 1];
        return previousChapter ? !isChapterCompleted(previousChapter.id) : false;
    };

    const getLevelColor = (level: string): string => {
        switch (level) {
            case "beginner":
                return "#4CAF50";
            case "intermediate":
                return "#2196F3";
            case "advanced":
                return "#9C27B0";
            default:
                return "#666";
        }
    };

    const getLevelLabel = (level: string): string => {
        switch (level) {
            case "beginner":
                return "Foundational";
            case "intermediate":
                return "Core";
            case "advanced":
                return "Advanced";
            default:
                return level;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading chapters...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="All Chapters" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {chapters.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="book-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No chapters available</Text>
                    </View>
                ) : (
                    chapters.map((chapter, index) => {
                        const completed = isChapterCompleted(chapter.id);
                        const locked = isChapterLocked(chapter, index);

                        return (
                            <TouchableOpacity
                                key={chapter.id}
                                style={[
                                    styles.chapterCard,
                                    locked && styles.chapterCardLocked,
                                    completed && styles.chapterCardCompleted,
                                ]}
                                onPress={() => !locked && handleChapterPress(chapter.id)}
                                disabled={locked}
                            >
                                <View style={styles.chapterTitleRow}>
                                    <Text style={styles.chapterNumber}>Chapter {chapter.orderIndex}</Text>
                                    {completed && (
                                        <View style={styles.completedBadge}>
                                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                            <Text style={styles.completedText}>Completed</Text>
                                        </View>
                                    )}
                                    {locked && (
                                        <View style={styles.lockedBadge}>
                                            <Ionicons name="lock-closed" size={16} color="#999" />
                                            <Text style={styles.lockedText}>Locked</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                {!!chapter.description && (
                                    <Text style={styles.chapterDescription} numberOfLines={2}>
                                        {chapter.description}
                                    </Text>
                                )}

                                <View style={styles.chapterFooter}>
                                    <View style={styles.metaInfo}>
                                        <Ionicons name="time-outline" size={14} color="#666" />
                                        <Text style={styles.metaText}>{chapter.estimatedMinutes} min</Text>
                                    </View>
                                    <View style={styles.metaInfo}>
                                        <Ionicons name="book-outline" size={14} color="#666" />
                                        <Text style={styles.metaText}>{lessonCounts[chapter.id] ?? 0} lessons</Text>
                                    </View>
                                    {!locked && (
                                        <Ionicons name="chevron-forward" size={20} color="#999" style={{ marginLeft: "auto" }} />
                                    )}
                                </View>
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

    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: "#999",
    },
    chapterCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    chapterCardLocked: {
        opacity: 0.6,
        backgroundColor: "#F5F5F5",
    },
    chapterCardCompleted: {
        borderColor: "#4CAF50",
        borderWidth: 2,
    },
    chapterTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    chapterNumber: {
        fontSize: 12,
        fontWeight: "600",
        color: "#F2B138",
        textTransform: "uppercase",
    },
    completedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#4CAF50",
    },
    lockedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    lockedText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#999",
    },
    chapterTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 6,
    },
    chapterDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    chapterFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    levelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        fontSize: 11,
        fontWeight: "700",
    },
    metaInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: "#666",
    },
});
