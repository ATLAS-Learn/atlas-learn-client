import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ui/screen-header";
import { apiClient } from "@/lib/api";
import { Subject } from "@/lib/types";
import { getCacheSync, setCache } from "@/lib/utils/cache";

const SUBJECTS_CACHE_KEY = "cache:subjects:list";
const PREFERRED_CACHE_KEY = "cache:preferred-subjects-ids";
const SUBJECTS_CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days
const PREFERRED_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function SkeletonCard() {
    const shimmer = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [shimmer]);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return (
        <Animated.View style={[styles.subjectCard, { opacity, borderColor: "#E0E0E0", backgroundColor: "#F0F0F0" }]}>
            <View style={styles.subjectInfo}>
                <View style={{ height: 16, width: "60%", backgroundColor: "#D0D0D0", borderRadius: 6 }} />
                <View style={{ height: 12, width: "30%", backgroundColor: "#E0E0E0", borderRadius: 4, marginTop: 6 }} />
                <View style={{ height: 12, width: "80%", backgroundColor: "#E8E8E8", borderRadius: 4, marginTop: 6 }} />
            </View>
            <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#D0D0D0" }} />
        </Animated.View>
    );
}

export default function BrowseSubjectsScreen() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [preferredIds, setPreferredIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadSubjects = useCallback(async (force = false) => {
        try {
            // 1. Seed from cache for instant display
            const cachedSubjects = getCacheSync<Subject[]>(SUBJECTS_CACHE_KEY);
            const cachedPreferred = getCacheSync<string[]>(PREFERRED_CACHE_KEY);
            if (cachedSubjects) {
                setSubjects(cachedSubjects);
                setPreferredIds(new Set(cachedPreferred || []));
                setLoading(false);
            }

            // 2. Always fetch fresh from network
            const [allSubjects, preferred] = await Promise.all([
                apiClient.getSubjects(),
                apiClient.getPreferredSubjects(),
            ]);
            setSubjects(allSubjects);
            // Clean stale IDs: keep only IDs that match real subjects
            const validIds = preferred.filter((id: string) =>
                allSubjects.some((s: Subject) => s.id === id)
            );
            const cleaned = validIds.length !== preferred.length;
            const finalIds = cleaned ? validIds : preferred;
            setPreferredIds(new Set(finalIds));
            if (cleaned) {
                apiClient.updatePreferredSubjects(finalIds).catch(() => {});
            }
            setCache(SUBJECTS_CACHE_KEY, allSubjects, SUBJECTS_CACHE_TTL).catch(() => {});
            setCache(PREFERRED_CACHE_KEY, finalIds, PREFERRED_CACHE_TTL).catch(() => {});
        } catch {
            const cached = getCacheSync<Subject[]>(SUBJECTS_CACHE_KEY);
            if (!cached) {
                Alert.alert("Error", "Failed to load subjects. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const toggleSubject = (id: string) => {
        setPreferredIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.updatePreferredSubjects(Array.from(preferredIds));
            Alert.alert("Saved", "Your subjects have been updated.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch {
            // Offline fallback — queue for background sync
            const { enqueueSubjectSelection } = await import("@/lib/utils/syncQueue");
            await enqueueSubjectSelection(Array.from(preferredIds));
            Alert.alert("Saved", "Your subjects will be updated when you're back online.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } finally {
            setSaving(false);
        }
    };

    const addedCount = preferredIds.size;
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadSubjects(true);
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="All Subjects" />

            {loading ? (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F2B138" />
                    }
                >
                    <Text style={styles.subtitle}>
                        Tap a subject to add or remove it from your learning path.
                    </Text>

                    {subjects.map((subject) => {
                        const isSelected = preferredIds.has(subject.id);
                        return (
                            <TouchableOpacity
                                key={subject.id}
                                style={[styles.subjectCard, isSelected && styles.subjectCardSelected]}
                                onPress={() => toggleSubject(subject.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.subjectInfo}>
                                    <Text style={[styles.subjectName, isSelected && styles.subjectNameSelected]}>
                                        {subject.name}
                                    </Text>
                                    <Text style={styles.subjectCode}>{subject.code}</Text>
                                    {subject.description && (
                                        <Text style={styles.subjectDescription} numberOfLines={2}>
                                            {subject.description}
                                        </Text>
                                    )}
                                </View>
                                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                                    {isSelected ? (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    ) : (
                                        <Ionicons name="add" size={14} color="#F2B138" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {!loading && (
                <View style={styles.footer}>
                    <Text style={styles.selectedCount}>
                        {addedCount} subject{addedCount !== 1 ? "s" : ""} selected
                    </Text>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },

    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
    scrollView: { flex: 1 },
    content: { padding: 24 },
    subtitle: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 20 },
    subjectCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#E0E0E0",
        marginBottom: 12,
    },
    subjectCardSelected: {
        borderColor: "#F2B138",
        backgroundColor: "#FFFDF5",
    },
    subjectInfo: { flex: 1, marginRight: 14 },
    subjectName: { fontSize: 16, fontWeight: "700", color: "#282F2E" },
    subjectNameSelected: { color: "#E65100" },
    subjectCode: { fontSize: 12, color: "#999", fontWeight: "600", marginTop: 2 },
    subjectDescription: { fontSize: 13, color: "#777", marginTop: 4, lineHeight: 18 },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#F2B138",
        alignItems: "center",
        justifyContent: "center",
    },
    badgeSelected: {
        backgroundColor: "#F2B138",
        borderColor: "#F2B138",
    },
    footer: {
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    selectedCount: { fontSize: 13, color: "#666", fontWeight: "600", marginBottom: 10, textAlign: "center" },
    saveButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: "center",
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
