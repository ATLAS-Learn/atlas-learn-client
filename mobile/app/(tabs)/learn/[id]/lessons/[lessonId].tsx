import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import Markdown from "react-native-markdown-display";
import { apiClient } from "@/lib/api";
import { Lesson, LessonWithProgress } from "@/lib/types";
import ScreenHeader from "@/components/ui/screen-header";
import { getCacheSync, setCache } from "@/lib/utils/cache";

const LESSON_CACHE_PREFIX = "cache:lesson:";
const LESSON_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
    const queryClient = useQueryClient();
    const { id, lessonId, subjectId } = useLocalSearchParams<{
        id: string;
        lessonId: string;
        subjectId?: string;
    }>();
    const chapterId = Array.isArray(id) ? id[0] : id;
    const lessonKey = Array.isArray(lessonId) ? lessonId[0] : lessonId;
    const subjectKey = Array.isArray(subjectId) ? subjectId[0] : subjectId;

    const [lesson, setLesson] = useState<LessonWithProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [completingLesson, setCompletingLesson] = useState(false);
    const [watchTime, setWatchTime] = useState("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const watchTimePresets = [300, 600, 1200, 1800];

    // Set default watch time from lesson's estimated duration
    useEffect(() => {
        if (lesson?.durationMinutes && !watchTime) {
            setWatchTime(String(lesson.durationMinutes * 60));
        }
    }, [lesson?.durationMinutes]);

    const isLessonCompleted = lesson?.isCompleted ||
        (lesson?.LessonProgress && lesson.LessonProgress.length > 0 && lesson.LessonProgress[0]?.isCompleted) || false;

    const examples = useMemo(() => normalizeStringArray(lesson?.examples), [lesson]);
    const keyPoints = useMemo(() => normalizeStringArray(lesson?.keyPoints), [lesson]);

    const loadLesson = useCallback(async () => {
        if (!chapterId || !lessonKey || !subjectKey) {
            Alert.alert("Missing Data", "Lesson identifiers are incomplete.");
            router.back();
            return;
        }

        const cacheKey = `${LESSON_CACHE_PREFIX}${subjectKey}:${chapterId}:${lessonKey}`;

        // Try loading from cache first for instant display
        const cached = getCacheSync<LessonWithProgress>(cacheKey);
        if (cached) {
            setLesson(cached);
            setLoading(false);
        }

        // Always fetch fresh data from server
        try {
            const data = await apiClient.getSubjectChapterLesson(subjectKey, chapterId, lessonKey, true);
            setLesson(data);
            // Cache the lesson content for offline/fast subsequent loads
            setCache(cacheKey, data, LESSON_CACHE_TTL).catch(() => {});
        } catch (error: any) {
            if (!cached) {
                Alert.alert("Error", error.message || "Failed to load lesson.");
                router.back();
            }
            // If we have cached data, keep showing it even if fetch fails
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
            const timeSpent = safeNumber(watchTime) || 0;
            const response = await apiClient.updateSubjectChapterLessonProgress(
                subjectKey,
                chapterId,
                lessonKey,
                {
                    timeSpent,
                }
            );
            setStatusMessage(response.message || "Progress updated.");
            await queryClient.invalidateQueries({ queryKey: ["progress"] });
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
            // Auto-save progress with estimated time before completing
            const timeSpent = safeNumber(watchTime) || (lesson?.durationMinutes ? lesson.durationMinutes * 60 : 0);
            if (timeSpent > 0) {
                try {
                    await apiClient.updateSubjectChapterLessonProgress(
                        subjectKey,
                        chapterId,
                        lessonKey,
                        { timeSpent }
                    );
                } catch {
                    // Progress save is best-effort; continue with completion
                }
            }
            const response = await apiClient.completeSubjectChapterLesson(subjectKey, chapterId, lessonKey);
            setStatusMessage(response.message || "Lesson marked as completed.");
            await queryClient.invalidateQueries({ queryKey: ["progress"] });
            // Use dismiss to pop back to the lessons list without stacking entries
            router.dismiss();
            Alert.alert(
                "Lesson Complete",
                "Great job! Moving to the next lesson."
            );
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
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScreenHeader title="Lesson" />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                <Text style={styles.lessonTitle}>{lesson.title || "Untitled lesson"}</Text>
                {lesson.durationMinutes ? (
                    <Text style={styles.lessonMeta}>Estimated {lesson.durationMinutes} min</Text>
                ) : null}

                {lesson.content ? (
                    <View style={styles.markdownContainer}>
                        <Markdown style={markdownStyles}>
                            {lesson.content}
                        </Markdown>
                    </View>
                ) : null}

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
                    <Text style={styles.sectionTitle}>Track Your Progress</Text>
                    {isLessonCompleted ? (
                        <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            <Text style={styles.completedBadgeText}>Lesson Completed</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionHelper}>
                                Add study time and tap Save Progress. When you finish, tap Mark Lesson Complete.
                            </Text>
                            <Text style={styles.fieldLabel}>Quick Study Time</Text>
                            <View style={styles.quickRow}>
                                {watchTimePresets.map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.quickButton,
                                            watchTime === String(value) && styles.quickButtonActive,
                                        ]}
                                        onPress={() => setWatchTime(String(value))}
                                    >
                                        <Text
                                            style={[
                                                styles.quickButtonText,
                                                watchTime === String(value) && styles.quickButtonTextActive,
                                            ]}
                                        >
                                            {Math.round(value / 60)}m
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={styles.fieldLabel}>Study Time (seconds)</Text>
                                <TextInput
                                    style={styles.progressInput}
                                    value={watchTime}
                                    onChangeText={setWatchTime}
                                    keyboardType="number-pad"
                                    placeholder="e.g. 300"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.progressButton}
                                onPress={handleUpdateProgress}
                                disabled={updatingProgress}
                            >
                                {updatingProgress ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.progressButtonText}>Save Progress</Text>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.sectionHelper}>
                                Your dashboard progress updates after this is saved by the server.
                            </Text>
                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={handleCompleteLesson}
                                disabled={completingLesson}
                            >
                                {completingLesson ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.completeButtonText}>Mark Lesson Complete</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                    {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
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
    fieldLabel: {
        fontSize: 12,
        color: "#4B5563",
        fontWeight: "700",
        marginBottom: 6,
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
        gap: 10,
        marginBottom: 12,
    },
    inputWrap: {
        flex: 1,
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
    quickButtonActive: {
        backgroundColor: "#FFF2CC",
        borderColor: "#F2B138",
    },
    quickButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
    },
    quickButtonTextActive: {
        color: "#8A5D00",
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
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 12,
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
    completedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#E8F5E9",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    completedBadgeText: {
        color: "#2E7D32",
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
        color: "#E57373",
    },
    markdownContainer: {
        marginBottom: 20,
    },
});

const markdownStyles = {
    body: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
    },
    heading1: {
        fontSize: 22,
        fontWeight: "700" as const,
        color: "#1F2524",
        marginBottom: 12,
        marginTop: 16,
    },
    heading2: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: "#1F2524",
        marginBottom: 10,
        marginTop: 14,
    },
    heading3: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: "#1F2524",
        marginBottom: 8,
        marginTop: 12,
    },
    paragraph: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
        marginBottom: 12,
    },
    strong: {
        fontWeight: "700" as const,
        color: "#1F2524",
    },
    em: {
        fontStyle: "italic" as const,
    },
    link: {
        color: "#F2B138",
        textDecorationLine: "underline" as const,
    },
    bullet_list: {
        marginBottom: 12,
    },
    listItem: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
        marginBottom: 4,
    },
    code_inline: {
        backgroundColor: "#F0F0F0",
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: "monospace",
        color: "#E65100",
    },
    code_block: {
        backgroundColor: "#F0F0F0",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        fontFamily: "monospace",
        fontSize: 14,
        lineHeight: 20,
    },
    fence: {
        backgroundColor: "#F0F0F0",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        fontFamily: "monospace",
        fontSize: 14,
        lineHeight: 20,
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: "#F2B138",
        paddingLeft: 12,
        marginLeft: 0,
        marginBottom: 12,
    },
    hr: {
        backgroundColor: "#E0E0E0",
        height: 1,
        marginVertical: 16,
    },
};
