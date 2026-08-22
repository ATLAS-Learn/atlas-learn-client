import React, { useCallback, useEffect, useState } from "react";
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
import ScreenHeader from "@/components/ui/screen-header";
import { apiClient } from "@/lib/api";
import { Subject } from "@/lib/types";
import { getCacheSync, setCache } from "@/lib/utils/cache";

const SUBJECTS_CACHE_KEY = "cache:subjects:list";
const SUBJECTS_CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

export default function SubjectsScreen() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSubjects = useCallback(async (force = false) => {
        try {
            // Fetch-once: skip network when valid cache exists
            const cached = getCacheSync<Subject[]>(SUBJECTS_CACHE_KEY);
            if (cached && !force) {
                setSubjects(cached);
                setLoading(false);
                return;
            }
            const data = await apiClient.getSubjects({ includeChapters: false });
            const list = Array.isArray(data) ? data : [];
            setSubjects(list);
            setCache(SUBJECTS_CACHE_KEY, list, SUBJECTS_CACHE_TTL).catch(() => {});
        } catch (error: any) {
            const cached = getCacheSync<Subject[]>(SUBJECTS_CACHE_KEY);
            if (!cached) Alert.alert("Error", error.message || "Failed to load subjects.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadSubjects(true);
    };

    const handleOpenSubject = (subject: Subject) => {
        console.log("[ID_TRACE] SubjectsScreen navigate subject detail", {
            subjectId: subject.id,
            subjectCode: subject.code,
        });
        router.push({
            pathname: "/(tabs)/learn/subjects/[subjectId]",
            params: { subjectId: subject.id, subjectCode: subject.code },
        } as any);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading subjects...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Subjects" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {subjects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={56} color="#CCC" />
                        <Text style={styles.emptyText}>No subjects available yet.</Text>
                    </View>
                ) : (
                    subjects.map((subject) => (
                        <TouchableOpacity
                            key={subject.id}
                            style={styles.subjectCard}
                            onPress={() => handleOpenSubject(subject)}
                        >
                            <View style={styles.subjectInfo}>
                                <Text style={styles.subjectTitle}>{subject.name}</Text>
                                <Text style={styles.subjectCode}>{subject.code}</Text>
                                {!!subject.description && (
                                    <Text style={styles.subjectDescription} numberOfLines={2}>
                                        {subject.description}
                                    </Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="#999" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    loadingText: { marginTop: 16, fontSize: 16, color: "#666" },

    scrollView: { flex: 1 },
    content: { padding: 24 },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    emptyText: { marginTop: 12, fontSize: 14, color: "#999", fontWeight: "600" },
    subjectCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 12,
    },
    subjectInfo: { flex: 1, marginRight: 12 },
    subjectTitle: { fontSize: 16, fontWeight: "700", color: "#1F2524" },
    subjectCode: { marginTop: 4, fontSize: 12, color: "#999", fontWeight: "700" },
    subjectDescription: { marginTop: 6, fontSize: 13, color: "#666" },
});
