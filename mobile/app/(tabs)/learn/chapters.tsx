import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
    const { highlightChapterId, fromChapterId, highlightUnlocked } = useLocalSearchParams<{
        highlightChapterId?: string;
        fromChapterId?: string;
        highlightUnlocked?: string;
    }>();
    const explicitHighlightedChapterId = Array.isArray(highlightChapterId) ? highlightChapterId[0] : highlightChapterId;
    const fromChapterKey = Array.isArray(fromChapterId) ? fromChapterId[0] : fromChapterId;
    const shouldHighlightUnlocked = (Array.isArray(highlightUnlocked) ? highlightUnlocked[0] : highlightUnlocked) === "true";
    const { user } = useUserStore();
    const scrollViewRef = useRef<ScrollView | null>(null);
    const chapterOffsetsRef = useRef<Record<string, number>>({});
    const highlightAnimation = useRef(new Animated.Value(0)).current;
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
    const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeHighlightChapterId, setActiveHighlightChapterId] = useState<string | null>(null);

    const loadChapters = useCallback(async () => {
        try {
            // Try loading from cache first for instant display
            const cachedChapters = getCacheSync<Chapter[]>(CHAPTERS_CACHE_KEY);
            const cachedCounts = getCacheSync<Record<string, number>>(LESSON_COUNTS_CACHE_KEY);
            if (cachedChapters) {
                setChapters(cachedChapters);
                setLessonCounts(cachedCounts || {});
                setLoading(false);
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
    }, [user?.level]);

    useEffect(() => {
        loadChapters();
    }, [loadChapters]);

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

    const handleRefresh = () => {
        setRefreshing(true);
        loadChapters();
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
                ref={scrollViewRef}
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
                        const levelColor = getLevelColor(chapter.level);
                        const isHighlighted = activeHighlightChapterId === chapter.id;
                        const highlightedBackground = highlightAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["#FFFFFF", "#FDE7A8"],
                        });
                        const highlightedBorder = highlightAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["#E0E0E0", "#BF522A"],
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
                                    onPress={() => !locked && handleChapterPress(chapter.id)}
                                    disabled={locked}
                                >
                                    <View style={styles.chapterHeader}>
                                        <View style={styles.chapterInfo}>
                                            <View style={styles.chapterTitleRow}>
                                                <Text style={styles.chapterNumber}>Chapter {chapter.order}</Text>
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
                                                {isHighlighted && (
                                                    <View style={styles.unlockedBadge}>
                                                        <Ionicons name="sparkles" size={14} color="#8A5D00" />
                                                        <Text style={styles.unlockedText}>Just unlocked</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                            <Text style={styles.chapterDescription} numberOfLines={2}>
                                                {chapter.description}
                                            </Text>
                                        </View>
                                        {!locked && (
                                            <Ionicons name="chevron-forward" size={24} color="#999" />
                                        )}
                                    </View>

                                    <View style={styles.chapterFooter}>
                                        <View style={[styles.levelBadge, { backgroundColor: `${levelColor}20` }]}>
                                            <Text style={[styles.levelText, { color: levelColor }]}>
                                                {getLevelLabel(chapter.level)}
                                            </Text>
                                        </View>
                                        <View style={styles.metaInfo}>
                                            <Ionicons name="time-outline" size={14} color="#666" />
                                            <Text style={styles.metaText}>{chapter.estimatedTime} min</Text>
                                        </View>
                                        <View style={styles.metaInfo}>
                                            <Ionicons name="book-outline" size={14} color="#666" />
                                            <Text style={styles.metaText}>{chapter.subject}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
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
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    chapterTapArea: {
        padding: 16,
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
    unlockedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FDE7A8",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    unlockedText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#8A5D00",
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
