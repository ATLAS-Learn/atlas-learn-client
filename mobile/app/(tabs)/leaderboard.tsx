import React, { useCallback, useRef, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
    Animated,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api";
import { useUserStore } from "@/lib/store/user";
import { API_BASE_URL } from "@/lib/constants/api";
import { getCacheSync, setCache } from "@/lib/utils/cache";
import { DISK_TTL } from "@/lib/config/cachePolicy";

const LEADERBOARD_CACHE_KEY = "cache:leaderboard";
const DARK_TEAL = "#084A59";
const GOLD = "#F2B138";
const BLACK = "#011C26";
const TEAL = "#12A67C";

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

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd for left-to-right display
const PODIUM_HEIGHTS = [140, 100, 70];
const PODIUM_COLORS = [GOLD, "#C0C0C0", "#CD7F32"];
const PODIUM_BG = ["#FFF8E1", "#F5F5F5", "#FFF3E0"];

export default function LeaderboardScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useUserStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const loadLeaderboard = useCallback(async (force = false) => {
        try {
            // Always show cache instantly
            const cached = getCacheSync<LeaderboardEntry[]>(LEADERBOARD_CACHE_KEY);
            if (cached && !force) {
                setLeaderboard(cached);
                setLoading(false);
            }

            // Always fetch fresh from server
            const data = await apiClient.getLeaderboard();
            setLeaderboard(data);
            setCache(LEADERBOARD_CACHE_KEY, data, DISK_TTL.LEADERBOARD).catch(() => {});
        } catch {
            const cached = getCacheSync<LeaderboardEntry[]>(LEADERBOARD_CACHE_KEY);
            if (!cached) setLeaderboard([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
            animateIn();
        }
    }, []);

    const animateIn = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    useFocusEffect(
        useCallback(() => {
            loadLeaderboard();
        }, [loadLeaderboard])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLeaderboard(true);
    }, [loadLeaderboard]);

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    const renderPodium = () => {
        if (top3.length === 0) return null;

        return (
            <View style={styles.podiumSection}>
                <View style={styles.podiumRow}>
                    {PODIUM_ORDER.map((rank, colIndex) => {
                        const entry = top3[rank];
                        if (!entry) return <View key={colIndex} style={styles.podiumEmpty} />;
                        const isFirst = rank === 0;
                        const height = PODIUM_HEIGHTS[rank];
                        const color = PODIUM_COLORS[rank];
                        const bg = PODIUM_BG[rank];

                        return (
                            <View key={colIndex} style={styles.podiumCol}>
                                <View style={styles.podiumAvatarWrap}>
                                    <View style={[styles.podiumAvatarBorder, { borderColor: color }]}>
                                        {entry.image ? (
                                            <Image
                                                source={{
                                                    uri: entry.image.startsWith("http")
                                                        ? entry.image
                                                        : `${API_BASE_URL}${entry.image}`,
                                                }}
                                                style={styles.podiumAvatar}
                                            />
                                        ) : (
                                            <View style={[styles.podiumAvatar, styles.podiumAvatarPlaceholder]}>
                                                <Ionicons name="person" size={isFirst ? 24 : 18} color="#999" />
                                            </View>
                                        )}
                                    </View>
                                    {isFirst && (
                                        <View style={styles.crownWrap}>
                                            <Ionicons name="star" size={14} color={GOLD} />
                                        </View>
                                    )}
                                </View>

                                <Text style={[styles.podiumName, entry.isCurrentUser && { color: GOLD }]} numberOfLines={1}>
                                    {entry.username ? `@${entry.username}` : entry.name.split(" ")[0]}
                                </Text>
                                <Text style={styles.podiumScore}>{entry.avgScore}%</Text>

                                <View style={[styles.podiumBar, { height, backgroundColor: bg }]}>
                                    <View style={[styles.podiumBarInner, { backgroundColor: color + "30" }]} />
                                    <Text style={[styles.podiumRank, { color }]}>{rank + 1}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const rank = index + 3;
        return (
            <Animated.View
                style={[
                    styles.card,
                    item.isCurrentUser && styles.cardCurrentUser,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{rank + 1}</Text>
                </View>
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
                            <Ionicons name="person" size={16} color="#999" />
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
                        {item.longestStreak ? ` · 🔥 ${item.longestStreak}d` : ""}
                    </Text>
                </View>
                <View style={styles.scoreWrap}>
                    <Text style={[styles.score, item.isCurrentUser && { color: GOLD }]}>{item.avgScore}%</Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={DARK_TEAL} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <Text style={styles.headerSubtitle}>Top learners this week</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={GOLD} />
                </View>
            ) : leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="trophy-outline" size={40} color="#CCC" />
                    </View>
                    <Text style={styles.emptyTitle}>No Data Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete quizzes and exams to appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={rest}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.userId}
                    ListHeaderComponent={renderPodium}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={GOLD}
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
        backgroundColor: "#F7F8FA",
    },
    header: {
        backgroundColor: DARK_TEAL,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#FFF",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#FFF",
        opacity: 0.6,
        marginTop: 4,
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

    // Podium
    podiumSection: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    podiumRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 12,
    },
    podiumCol: {
        alignItems: "center",
        flex: 1,
    },
    podiumEmpty: {
        flex: 1,
    },
    podiumAvatarWrap: {
        marginBottom: 8,
        alignItems: "center",
    },
    podiumAvatarBorder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        padding: 2,
    },
    podiumAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    podiumAvatarPlaceholder: {
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },
    crownWrap: {
        position: "absolute",
        top: -8,
        backgroundColor: "#FFF",
        borderRadius: 10,
        padding: 2,
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    podiumName: {
        fontSize: 13,
        fontWeight: "700",
        color: BLACK,
        marginBottom: 2,
    },
    podiumScore: {
        fontSize: 18,
        fontWeight: "800",
        color: DARK_TEAL,
        marginBottom: 8,
    },
    podiumBar: {
        width: "100%",
        borderRadius: 12,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 10,
        overflow: "hidden",
    },
    podiumBarInner: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 12,
    },
    podiumRank: {
        fontSize: 24,
        fontWeight: "900",
        opacity: 0.5,
    },

    // Cards
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    cardCurrentUser: {
        borderColor: GOLD,
        backgroundColor: "#FFFDF5",
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    rankBadgeText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#999",
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        fontSize: 15,
        fontWeight: "700",
        color: BLACK,
    },
    nameCurrentUser: {
        color: GOLD,
    },
    meta: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    scoreWrap: {
        backgroundColor: "#F7F8FA",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    score: {
        fontSize: 16,
        fontWeight: "800",
        color: DARK_TEAL,
    },

    // Empty
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: BLACK,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#999",
        marginTop: 8,
        textAlign: "center",
    },
});
