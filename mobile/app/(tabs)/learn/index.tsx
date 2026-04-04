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
import { useRouter } from "expo-router";
import { apiClient } from "@/lib/api";
import { Subject, SubjectProgress } from "@/lib/types";
import { useOverallProgress } from "@/lib/hooks/api";
import { useUserStore } from "@/lib/store/user";

const SURFACE_COLORS = ["#FFE8D8", "#E8F7EE", "#EAF2FF", "#FFF1C9"];
const ACCENT_COLORS = ["#A55A17", "#20704F", "#2563C9", "#B78103"];

const getChapterCount = (subject: Subject): number => {
    return Array.isArray(subject.chapters) ? subject.chapters.length : 0;
};

const normalizeNumber = (value: unknown): number => {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

export default function LearnHubScreen() {
    const router = useRouter();
    const { user } = useUserStore();
    const { data: overallProgress, refetch: refetchOverallProgress, isRefetching } = useOverallProgress();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const displayName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

    const subjectProgressMap = useMemo(() => {
        const entries = Array.isArray(overallProgress?.subjects) ? overallProgress.subjects : [];
        return new Map<string, SubjectProgress>(entries.map((entry) => [entry.subjectId, entry]));
    }, [overallProgress?.subjects]);

    const orderedSubjects = useMemo(() => {
        return [...subjects].sort((left, right) => {
            const leftProgress = normalizeNumber(subjectProgressMap.get(left.id)?.completionPercentage);
            const rightProgress = normalizeNumber(subjectProgressMap.get(right.id)?.completionPercentage);

            const leftStarted = leftProgress > 0 ? 1 : 0;
            const rightStarted = rightProgress > 0 ? 1 : 0;
            if (leftStarted !== rightStarted) {
                return rightStarted - leftStarted;
            }

            if (leftProgress !== rightProgress) {
                return rightProgress - leftProgress;
            }

            return left.name.localeCompare(right.name);
        });
    }, [subjectProgressMap, subjects]);

    const loadSubjects = useCallback(async () => {
        try {
            const data = await apiClient.getSubjects({
                includeChapters: true,
                includeChapterDetails: true,
            });
            setSubjects(Array.isArray(data) ? data : []);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Could not load your subjects.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        void refetchOverallProgress();
        void loadSubjects();
    }, [loadSubjects, refetchOverallProgress]);

    const handleOpenSubject = (subject: Subject) => {
        router.push({
            pathname: "/(tabs)/learn/subjects/[subjectId]",
            params: { subjectId: subject.id, subjectCode: subject.code },
        } as any);
    };

    const overallCompletion = Math.round(normalizeNumber(overallProgress?.overall?.completionPercentage));
    const completedLessons = normalizeNumber(overallProgress?.overall?.lessons?.completed);
    const totalLessons = normalizeNumber(overallProgress?.overall?.lessons?.total);
    const totalMinutes = Math.round(normalizeNumber(overallProgress?.overall?.totalTimeSpent) / 60);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D88A1C" />
                <Text style={styles.loadingText}>Setting up your study space...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={handleRefresh} />}
        >
            <View style={styles.heroCard}>
                <View style={styles.heroGlowOne} />
                <View style={styles.heroGlowTwo} />
                <Text style={styles.heroEyebrow}>Learn</Text>
                <Text style={styles.heroTitle}>Hey {displayName}, let&apos;s keep the momentum going.</Text>
                <Text style={styles.heroText}>
                    Pick a subject and we&apos;ll keep chapters in the right order, with the next one locked until you unlock it.
                </Text>

                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatPill}>
                        <Text style={styles.heroStatValue}>{overallCompletion}%</Text>
                        <Text style={styles.heroStatLabel}>overall</Text>
                    </View>
                    <View style={styles.heroStatPill}>
                        <Text style={styles.heroStatValue}>
                            {completedLessons}/{totalLessons}
                        </Text>
                        <Text style={styles.heroStatLabel}>lessons</Text>
                    </View>
                    <View style={styles.heroStatPill}>
                        <Text style={styles.heroStatValue}>{totalMinutes}m</Text>
                        <Text style={styles.heroStatLabel}>study time</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Your subjects</Text>
                    <Text style={styles.sectionText}>Started topics float to the top so it&apos;s easier to jump back in.</Text>
                </View>
                <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountText}>{orderedSubjects.length}</Text>
                </View>
            </View>

            {orderedSubjects.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Ionicons name="sparkles-outline" size={28} color="#D88A1C" />
                    <Text style={styles.emptyTitle}>No subjects yet</Text>
                    <Text style={styles.emptyText}>Once subjects are available, they&apos;ll show up here in a cleaner study flow.</Text>
                </View>
            ) : (
                orderedSubjects.map((subject, index) => {
                    const progress = normalizeNumber(subjectProgressMap.get(subject.id)?.completionPercentage);
                    const chapters = getChapterCount(subject);
                    const colorIndex = index % SURFACE_COLORS.length;
                    const chapterLabel = chapters === 1 ? "chapter" : "chapters";

                    return (
                        <TouchableOpacity
                            key={subject.id}
                            style={[styles.subjectCard, { backgroundColor: SURFACE_COLORS[colorIndex] }]}
                            onPress={() => handleOpenSubject(subject)}
                            activeOpacity={0.88}
                        >
                            <View style={styles.subjectTopRow}>
                                <View style={[styles.subjectIconWrap, { backgroundColor: `${ACCENT_COLORS[colorIndex]}18` }]}>
                                    <Ionicons name="book-outline" size={20} color={ACCENT_COLORS[colorIndex]} />
                                </View>
                                <View style={styles.subjectCodeBadge}>
                                    <Text style={styles.subjectCode}>{subject.code}</Text>
                                </View>
                            </View>

                            <Text style={styles.subjectTitle}>{subject.name}</Text>
                            <Text style={styles.subjectDescription} numberOfLines={2}>
                                {subject.description || "Tap in and move chapter by chapter at your own pace."}
                            </Text>

                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${Math.max(6, progress)}%`, backgroundColor: ACCENT_COLORS[colorIndex] }]} />
                            </View>

                            <View style={styles.subjectFooter}>
                                <Text style={styles.subjectMeta}>
                                    {Math.round(progress)}% done • {chapters} {chapterLabel}
                                </Text>
                                <View style={styles.openChip}>
                                    <Text style={styles.openChipText}>Open</Text>
                                    <Ionicons name="arrow-forward" size={14} color="#1F2524" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF8EF",
    },
    content: {
        padding: 20,
        paddingBottom: 36,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF8EF",
    },
    loadingText: {
        marginTop: 14,
        fontSize: 15,
        color: "#7B6A58",
    },
    heroCard: {
        position: "relative",
        overflow: "hidden",
        padding: 24,
        borderRadius: 30,
        backgroundColor: "#1F2A24",
        marginBottom: 22,
    },
    heroGlowOne: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "#F7B733",
        opacity: 0.18,
        top: -50,
        right: -40,
    },
    heroGlowTwo: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F08A5D",
        opacity: 0.16,
        bottom: -30,
        left: -10,
    },
    heroEyebrow: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#F2B138",
        marginBottom: 10,
    },
    heroTitle: {
        fontSize: 31,
        lineHeight: 37,
        fontWeight: "900",
        color: "#FFF8EF",
    },
    heroText: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 21,
        color: "#D8DDD8",
        maxWidth: "90%",
    },
    heroStatsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 18,
    },
    heroStatPill: {
        minWidth: 92,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: "rgba(255,248,239,0.1)",
    },
    heroStatValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#FFF8EF",
    },
    heroStatLabel: {
        marginTop: 2,
        fontSize: 12,
        color: "#CBD4CD",
        textTransform: "lowercase",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 23,
        fontWeight: "900",
        color: "#1F2524",
    },
    sectionText: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: "#756452",
        maxWidth: 250,
    },
    sectionCountBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1F2524",
    },
    sectionCountText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#FFF8EF",
    },
    emptyCard: {
        alignItems: "center",
        paddingVertical: 36,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: "#FFF1D7",
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: "800",
        color: "#1F2524",
    },
    emptyText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 19,
        color: "#756452",
        textAlign: "center",
    },
    subjectCard: {
        borderRadius: 26,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(31,37,36,0.07)",
    },
    subjectTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    subjectIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    subjectCodeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,252,246,0.72)",
    },
    subjectCode: {
        fontSize: 11,
        fontWeight: "800",
        color: "#5C5249",
        letterSpacing: 0.8,
    },
    subjectTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: "#1F2524",
    },
    subjectDescription: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 19,
        color: "#5F5A54",
    },
    progressTrack: {
        height: 11,
        borderRadius: 999,
        backgroundColor: "rgba(255,252,246,0.8)",
        overflow: "hidden",
        marginTop: 16,
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
    },
    subjectFooter: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    subjectMeta: {
        flex: 1,
        fontSize: 13,
        fontWeight: "700",
        color: "#3E403E",
    },
    openChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(255,252,246,0.8)",
    },
    openChipText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#1F2524",
    },
});
