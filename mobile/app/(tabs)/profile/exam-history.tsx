import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VictoryChart, VictoryLine, VictoryArea, VictoryScatter, VictoryAxis, VictoryTheme, VictoryLabel } from "victory-native";
import { apiClient } from "@/lib/api";
import ScreenHeader from "@/components/ui/screen-header";
import { getCacheSync, setCache } from "@/lib/utils/cache";
import { DISK_TTL } from "@/lib/config/cachePolicy";

const EXAM_HISTORY_CACHE_KEY = "cache:exam-history";

export default function ExamHistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = useCallback(async (force = false) => {
        try {
            // 1. Seed from cache for instant display
            const cached = getCacheSync<any[]>(EXAM_HISTORY_CACHE_KEY);
            if (cached) {
                setHistory(cached);
                setLoading(false);
            }

            // 2. Always fetch fresh from network
            const data = await apiClient.getUserExamHistory();
            setHistory(data);
            setCache(EXAM_HISTORY_CACHE_KEY, data, DISK_TTL.DYNAMIC).catch(() => {});
        } catch {
            const cached = getCacheSync<any[]>(EXAM_HISTORY_CACHE_KEY);
            if (!cached) setHistory([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    React.useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadHistory(true);
    }, [loadHistory]);

    const stats = useMemo(() => {
        if (history.length === 0) return null;
        const scores = history.map((h) => h.score ?? 0);
        const total = scores.length;
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
        const passed = scores.filter((s) => s >= 70).length;
        const passRate = Math.round((passed / total) * 100);
        const best = Math.max(...scores);
        return { total, avg, passRate, best };
    }, [history]);

    const chartData = useMemo(() => {
        if (history.length === 0) return [];
        const sorted = [...history].sort(
            (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
        return sorted.map((h, i) => ({
            x: i + 1,
            y: h.score ?? 0,
        }));
    }, [history]);

    const screenWidth = Dimensions.get("window").width - 48;
    const tickInterval = chartData.length <= 10 ? 1 : chartData.length <= 20 ? 2 : 5;

    const renderHeader = () => (
        <>
            {stats && (
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: stats.avg >= 70 ? "#16A34A" : "#DC2626" }]}>{stats.avg}%</Text>
                        <Text style={styles.statLabel}>Average</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: stats.passRate >= 50 ? "#16A34A" : "#DC2626" }]}>{stats.passRate}%</Text>
                        <Text style={styles.statLabel}>Pass Rate</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: "#F2B138" }]}>{stats.best}%</Text>
                        <Text style={styles.statLabel}>Best</Text>
                    </View>
                </View>
            )}

            {chartData.length >= 2 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Score Progress</Text>
                    <VictoryChart
                        width={screenWidth}
                        height={200}
                        theme={VictoryTheme.material}
                        padding={{ left: 50, right: 20, top: 20, bottom: 40 }}
                    >
                        <VictoryAxis
                            tickValues={chartData
                                .filter((_, i) => i % tickInterval === 0)
                                .map((d) => d.x)}
                            style={{
                                tickLabels: { fontSize: 10, fill: "#999" },
                            }}
                        />
                        <VictoryAxis
                            dependentAxis
                            tickCount={5}
                            style={{
                                tickLabels: { fontSize: 10, fill: "#999" },
                            }}
                        />
                        <VictoryArea
                            data={chartData}
                            style={{
                                data: {
                                    fill: "#084A59",
                                    fillOpacity: 0.15,
                                    stroke: "#084A59",
                                    strokeWidth: 2,
                                },
                            }}
                        />
                        <VictoryLine
                            data={chartData}
                            style={{
                                data: {
                                    stroke: "#084A59",
                                    strokeWidth: 2,
                                },
                            }}
                        />
                        <VictoryScatter
                            data={chartData}
                            size={chartData.length <= 15 ? 4 : 3}
                            style={{
                                data: {
                                    fill: "#084A59",
                                    stroke: "#fff",
                                    strokeWidth: 1,
                                },
                            }}
                        />
                    </VictoryChart>
                </View>
            )}
        </>
    );

    const renderItem = ({ item }: { item: any }) => {
        const passed = item.score >= 70;
        const date = item.completedAt ? new Date(item.completedAt).toLocaleDateString() : "";
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() =>
                    router.push({
                        pathname: "/(tabs)/exams/result/[id]" as any,
                        params: { id: item.examId },
                    })
                }
                activeOpacity={0.7}
            >
                <View style={styles.cardLeft}>
                    <Ionicons
                        name={passed ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={passed ? "#16A34A" : "#DC2626"}
                    />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.exam?.title || "Exam"}</Text>
                    <Text style={styles.cardMeta}>
                        {item.exam?.subject?.name || "General"} · {date}
                    </Text>
                </View>
                <Text style={[styles.cardScore, { color: passed ? "#16A34A" : "#DC2626" }]}>
                    {item.score}%
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Exam History" />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyTitle}>No Exam History</Text>
                    <Text style={styles.emptySubtitle}>
                        Your exam results will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F2B138" />
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
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1F2524",
    },
    statLabel: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
        fontWeight: "600",
    },
    chartContainer: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2524",
        marginBottom: 8,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    cardLeft: {
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2524",
    },
    cardMeta: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    cardScore: {
        fontSize: 16,
        fontWeight: "800",
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
