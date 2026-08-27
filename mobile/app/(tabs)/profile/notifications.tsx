import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import ScreenHeader from "@/components/ui/screen-header";

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    relatedExamId?: string;
    relatedQuizId?: string;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async (force = false) => {
        try {
            const data = await apiClient.getNotifications();
            setNotifications(data);
        } catch {
            if (!force) setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNotifications(true);
    }, [loadNotifications]);

    const handleMarkAllRead = async () => {
        try {
            await apiClient.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch {
            Alert.alert("Error", "Failed to mark notifications as read.");
        }
    };

    const handleNotificationPress = async (notification: NotificationItem) => {
        if (!notification.isRead) {
            try {
                await apiClient.markNotificationRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
            } catch { }
        }

        if (notification.relatedExamId) {
            router.push({ pathname: "/(tabs)/exams/[id]" as any, params: { id: notification.relatedExamId } });
        } else if (notification.relatedQuizId) {
            router.push({ pathname: "/(tabs)/exams/[id]" as any, params: { id: notification.relatedQuizId } });
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "EXAM_PUBLISHED": return "document-text-outline";
            case "EXAM_CORRECTED": return "checkmark-circle-outline";
            case "QUIZ_PUBLISHED": return "help-circle-outline";
            case "SYSTEM": return "information-circle-outline";
            default: return "notifications-outline";
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "EXAM_PUBLISHED": return "#F2B138";
            case "EXAM_CORRECTED": return "#12A67C";
            case "QUIZ_PUBLISHED": return "#084A59";
            default: return "#666";
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const renderNotification = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.isRead && styles.notificationUnread]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + "15" }]}>
                <Ionicons name={getNotificationIcon(item.type) as any} size={20} color={getNotificationColor(item.type)} />
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Notifications" onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Notifications"
                onBack={() => router.back()}
                rightAction={
                    unreadCount > 0 ? (
                        <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={styles.markAllReadText}>Mark all read</Text>
                        </TouchableOpacity>
                    ) : undefined
                }
            />
            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptySubtitle}>You're all caught up!</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={item => item.id}
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
        paddingBottom: 32,
    },
    markAllReadText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#F2B138",
    },
    notificationCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    notificationUnread: {
        backgroundColor: "#FFF8E7",
        borderColor: "#F2B13830",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1F2524",
        marginBottom: 2,
    },
    notificationMessage: {
        fontSize: 13,
        color: "#666",
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: 11,
        color: "#999",
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#F2B138",
        marginTop: 6,
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
    },
});
