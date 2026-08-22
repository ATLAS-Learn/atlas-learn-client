import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
            const cached = getCacheSync<any[]>(EXAM_HISTORY_CACHE_KEY);
            if (cached && !force) {
                setHistory(cached);
                setLoading(false);
                return;
            }
            if (cached) {
                setHistory(cached);
                setLoading(false);
            }

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
