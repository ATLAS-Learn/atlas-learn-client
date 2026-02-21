import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { Lesson } from "@/lib/types";
import { useProgressStore } from "@/lib/store/progress";

const safeNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return undefined;
    return parsed;
};

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
    }
    if (typeof value === "string" && value.trim()) {
        return value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

export default function LessonDetailScreen() {
    const router = useRouter();
    const { id, lessonId, subjectId } = useLocalSearchParams<{
        id: string;
        lessonId: string;
        subjectId?: string;
    }>();
    const chapterId = Array.isArray(id) ? id[0] : id;
    const lessonKey = Array.isArray(lessonId) ? lessonId[0] : lessonId;
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [completingLesson, setCompletingLesson] = useState(false);
    const [watchTime, setWatchTime] = useState("300");
    const [progressPercent, setProgressPercent] = useState("");
    const [positionSeconds, setPositionSeconds] = useState("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const { setLastLesson, completeLesson } = useProgressStore();

    const examples = useMemo(() => normalizeStringArray(lesson?.examples), [lesson]);
    const keyPoints = useMemo(() => normalizeStringArray(lesson?.keyPoints), [lesson]);

    const loadLesson = useCallback(async () => {
        if (!chapterId || !lessonKey || !subjectKey) {
            Alert.alert("Missing Data", "Lesson identifiers are incomplete.");
            router.back();
            return;
        }
        setLoading(true);
        try {
            const data = await apiClient.getSubjectChapterLesson(subjectKey, chapterId, lessonKey);
            setLesson(data);
            setLastLesson(chapterId, lessonKey);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load lesson.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [chapterId, lessonKey, router, subjectKey]);

    useEffect(() => {
        loadLesson();
    }, [loadLesson]);

    const handleOpenLink = async (url: string, label: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (!supported) {
                Alert.alert("Unavailable", `Cannot open ${label}.`);
                return;
            }
            await Linking.openURL(url);
        } catch {
            Alert.alert("Error", `Failed to open ${label}.`);
        }
    };

    const handleOpenPdf = async () => {
        if (!chapterId || !lessonKey || !subjectKey) return;
        try {
            const pdf = await apiClient.getSubjectChapterLessonPdf(subjectKey, chapterId, lessonKey);
            const url = pdf.url || lesson?.pdfUrl;
            if (!url) {
                Alert.alert("No PDF", "This lesson does not have PDF materials.");
                return;
            }
            await handleOpenLink(url, "PDF");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch lesson PDF.");
        }
    };

    const handleUpdateProgress = async () => {
        if (!chapterId || !lessonKey || !subjectKey) return;
        setUpdatingProgress(true);
        setStatusMessage(null);
        try {
            const watchTimeSeconds = safeNumber(watchTime);
            const progressValue = safeNumber(progressPercent);
            const positionValue = safeNumber(positionSeconds);
            const computedPosition =
                positionValue ??
                (progressValue !== undefined && lesson?.durationSeconds
                    ? Math.round((progressValue / 100) * lesson.durationSeconds)
                    : undefined);
            const response = await apiClient.updateSubjectChapterLessonProgress(
                subjectKey,
                chapterId,
                lessonKey,
                {
                    watchTimeSeconds,
                    progressPercent: progressValue,
                    positionSeconds: computedPosition,
                }
            );
            setStatusMessage(response.message || "Progress updated.");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update lesson progress.");
        } finally {
            setUpdatingProgress(false);
        }
    };

    const handleCompleteLesson = async () => {
        if (!chapterId || !lessonKey || !subjectKey) return;
        setCompletingLesson(true);
        setStatusMessage(null);
        try {
            const response = await apiClient.completeSubjectChapterLesson(subjectKey, chapterId, lessonKey);
            completeLesson(lessonKey);
            setStatusMessage(response.message || "Lesson marked as completed.");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to complete lesson.");
        } finally {
            setCompletingLesson(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading lesson...</Text>
            </View>
        );
    }

    if (!lesson) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Lesson not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lesson</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.lessonTitle}>{lesson.title || "Untitled lesson"}</Text>
                {lesson.estimatedMinutes ? (
                    <Text style={styles.lessonMeta}>Estimated {lesson.estimatedMinutes} min</Text>
                ) : lesson.durationSeconds ? (
                    <Text style={styles.lessonMeta}>
                        Estimated {Math.ceil(lesson.durationSeconds / 60)} min
                    </Text>
                ) : null}

                {lesson.content ? <Text style={styles.lessonContent}>{lesson.content}</Text> : null}

                {examples.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Examples</Text>
                        {examples.map((item, index) => (
                            <Text key={`${item}-${index}`} style={styles.sectionItem}>
                                • {item}
                            </Text>
                        ))}
                    </View>
                )}

                {keyPoints.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Key Points</Text>
                        {keyPoints.map((item, index) => (
                            <Text key={`${item}-${index}`} style={styles.sectionItem}>
                                • {item}
                            </Text>
                        ))}
                    </View>
                )}

                <View style={styles.actionRow}>
                    {lesson.videoUrl ? (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleOpenLink(lesson.videoUrl!, "video")}
                        >
                            <Ionicons name="play-circle" size={18} color="#F2B138" />
                            <Text style={styles.actionButtonText}>Play Video</Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={styles.actionButton} onPress={handleOpenPdf}>
                        <Ionicons name="document-text" size={18} color="#F2B138" />
                        <Text style={styles.actionButtonText}>Open PDF</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Progress</Text>
                    <Text style={styles.sectionHelper}>
                        Log your watch time to keep your progress updated.
                    </Text>
                    <View style={styles.progressRow}>
                        <TextInput
                            style={styles.progressInput}
                            value={watchTime}
                            onChangeText={setWatchTime}
                            keyboardType="number-pad"
                            placeholder="Watch time (sec)"
                        />
                        <TextInput
                            style={styles.progressInput}
                            value={progressPercent}
                            onChangeText={setProgressPercent}
                            keyboardType="number-pad"
                            placeholder="Progress %"
                        />
                    </View>
                    <View style={styles.progressRow}>
                        <TextInput
                            style={styles.progressInput}
                            value={positionSeconds}
                            onChangeText={setPositionSeconds}
                            keyboardType="number-pad"
                            placeholder="Position (sec)"
                        />
                        <TouchableOpacity
                            style={styles.progressButton}
                            onPress={handleUpdateProgress}
                            disabled={updatingProgress}
                        >
                            {updatingProgress ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.progressButtonText}>Update</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickRow}>
                        {[25, 50, 75, 100].map((value) => (
                            <TouchableOpacity
                                key={value}
                                style={styles.quickButton}
                                onPress={() => setProgressPercent(String(value))}
                            >
                                <Text style={styles.quickButtonText}>{value}%</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleCompleteLesson}
                        disabled={completingLesson}
                    >
                        {completingLesson ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.completeButtonText}>Mark Completed</Text>
                        )}
                    </TouchableOpacity>
                    {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
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
        padding: 24,
    },
    lessonTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1F2524",
        marginBottom: 6,
    },
    lessonMeta: {
        fontSize: 13,
        color: "#666",
        marginBottom: 16,
        fontWeight: "600",
    },
    lessonContent: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
        marginBottom: 20,
    },
    sectionCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EEE",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 8,
    },
    sectionItem: {
        fontSize: 14,
        color: "#444",
        marginBottom: 6,
        lineHeight: 20,
    },
    sectionHelper: {
        fontSize: 12,
        color: "#666",
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFF8E8",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F5E5BE",
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#8A5D00",
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    quickRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
        flexWrap: "wrap",
    },
    quickButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
    },
    quickButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
    },
    progressInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: "#FAFAFA",
    },
    progressButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    progressButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    completeButton: {
        backgroundColor: "#1F2937",
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 10,
    },
    completeButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    statusMessage: {
        marginTop: 12,
        fontSize: 12,
        color: "#2E7D32",
        fontWeight: "600",
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
    errorText: {
        fontSize: 16,
        color: "#F44336",
    },
});
