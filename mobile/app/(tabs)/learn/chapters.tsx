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
import { apiClient } from "@/lib/api";
import { Chapter } from "@/lib/types";
import { useUserStore } from "@/lib/store/user";

export default function ChaptersListScreen() {
    const router = useRouter();
    const { user } = useUserStore();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadChapters();
    }, []);

    const loadChapters = async () => {
        try {
            const [data, progressData] = await Promise.all([
                apiClient.getChapters(),
                apiClient.getOverallProgress(),
            ]);

            const sortedAllChapters = [...data].sort((a, b) => a.order - b.order);
            const completedCount = Math.max(
                0,
                Math.min(progressData?.overall?.chapters?.completed || 0, sortedAllChapters.length)
            );
            const completedChapterIds = new Set<string>(
                sortedAllChapters.slice(0, completedCount).map((chapter) => chapter.id)
            );

            // Filter chapters by user level if set
            let filteredChapters = data;
            if (user?.level) {
                filteredChapters = data.filter((chapter) => chapter.level === user.level);
            }
            // Sort by order
            filteredChapters.sort((a, b) => a.order - b.order);
            setChapters(filteredChapters);
            setCompletedChapters(completedChapterIds);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load chapters. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Chapters</Text>
                <View style={styles.backButton} />
            </View>

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
                        const levelColor = getLevelColor(chapter.level);

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
    chapterHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    chapterInfo: {
        flex: 1,
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
