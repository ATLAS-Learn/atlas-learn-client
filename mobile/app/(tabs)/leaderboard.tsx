import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { useUserStore } from "@/lib/store/user";
import { API_BASE_URL } from "@/lib/constants/api";
import ScreenHeader from "@/components/ui/screen-header";
import { getCacheSync, setCache } from "@/lib/utils/cache";
import { DISK_TTL } from "@/lib/config/cachePolicy";

const LEADERBOARD_CACHE_KEY = "cache:leaderboard";

interface LeaderboardEntry {
    userId: string;
    name: string;
    username?: string;
    image?: string;
    school?: string;
    avgScore: number;
    totalQuizzes: number;
    totalExams: number;
    lessonsCompleted: number;
    longestStreak?: number;
    isCurrentUser: boolean;
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const TOP5_BG = ["#FFF8E1", "#FFF8E1", "#FFF8E1", "#F5F5F5", "#F5F5F5"];

export default function LeaderboardScreen() {
    const { user } = useUserStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadLeaderboard = useCallback(async (force = false) => {
        try {
            const cached = getCacheSync<LeaderboardEntry[]>(LEADERBOARD_CACHE_KEY);
            if (cached && !force) {
                setLeaderboard(cached);
                setLoading(false);
                return;
            }
            if (cached) {
                setLeaderboard(cached);
                setLoading(false);
            }

            const data = await apiClient.getLeaderboard();
            setLeaderboard(data);
            setCache(LEADERBOARD_CACHE_KEY, data, DISK_TTL.LEADERBOARD).catch(() => {});
        } catch {
            const cached = getCacheSync<LeaderboardEntry[]>(LEADERBOARD_CACHE_KEY);
            if (!cached) setLeaderboard([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    React.useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLeaderboard(true);
    }, [loadLeaderboard]);

    const getRankBadge = (index: number) => {
        if (index === 0) {
            return (
                <View style={styles.rankBadgeTop}>
                    <Text style={styles.trophyIcon}>🏆</Text>
                </View>
            );
        }
        if (index === 1) {
            return (
                <View style={[styles.rankBadge, { backgroundColor: MEDAL_COLORS[1] + "20" }]}>
                    <Text style={[styles.rankBadgeText, { color: MEDAL_COLORS[1] }]}>2</Text>
                </View>
            );
        }
        if (index === 2) {
            return (
                <View style={[styles.rankBadge, { backgroundColor: MEDAL_COLORS[2] + "20" }]}>
                    <Text style={[styles.rankBadgeText, { color: MEDAL_COLORS[2] }]}>3</Text>
                </View>
            );
        }
        return (
            <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{index + 1}</Text>
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isTop5 = index < 5;
        return (
            <View
                style={[
                    styles.card,
                    item.isCurrentUser && styles.cardCurrentUser,
                    isTop5 && index < 3 && styles.cardTop3,
                ]}
            >
                {getRankBadge(index)}
                <View style={styles.avatarContainer}>
                    {item.image ? (
                        <Image
                            source={{
                                uri: item.image.startsWith("http")
                                    ? item.image
                                    : `${API_BASE_URL}${item.image}`,
                            }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={18} color="#999" />
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text
                        style={[styles.name, item.isCurrentUser && styles.nameCurrentUser]}
                        numberOfLines={1}
                    >
                        {item.username ? `@${item.username}` : item.name}
                        {item.isCurrentUser ? " (You)" : ""}
                    </Text>
                    <Text style={styles.meta}>
                        {item.lessonsCompleted} lessons · {item.totalQuizzes} quizzes
                        {item.longestStreak ? ` · 🔥 ${item.longestStreak}d streak` : ""}
                    </Text>
                </View>
                <Text style={styles.score}>{item.avgScore}%</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Leaderboard" showBack={false} />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            ) : leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="trophy-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyTitle}>No Leaderboard Data</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete quizzes and exams to appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.userId}
                    ListHeaderComponent={
                        <View style={styles.headerBanner}>
                            <Text style={styles.headerTrophy}>🏆</Text>
                            <Text style={styles.headerTitle}>Top Learners</Text>
                            <Text style={styles.headerSubtitle}>
                                Based on quiz & exam performance
                            </Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#F2B138"
                        />
                    }
                />
            )}
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
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    headerBanner: {
        alignItems: "center",
        paddingVertical: 28,
        marginBottom: 12,
        backgroundColor: "#FFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    headerTrophy: {
        fontSize: 52,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1F2524",
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#999",
        marginTop: 4,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    cardCurrentUser: {
        borderColor: "#F2B138",
        backgroundColor: "#FFFDF5",
    },
    cardTop3: {
        backgroundColor: "#FFFBF0",
        borderColor: "#F2D98B",
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    rankBadgeTop: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFF8E1",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
        borderWidth: 1.5,
        borderColor: "#FFD700",
    },
    trophyIcon: {
        fontSize: 20,
    },
    rankBadgeText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#999",
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1F2524",
    },
    nameCurrentUser: {
        color: "#F2B138",
    },
    meta: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },
    score: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1F2524",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F2524",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#999",
        marginTop: 8,
        textAlign: "center",
    },
});
