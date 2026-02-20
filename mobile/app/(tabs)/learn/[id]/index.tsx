import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { Chapter } from "@/lib/types";
import ChapterHeader from "@/components/lessons/chapter-header";
import ContentSection from "@/components/lessons/content-section";

export default function ChapterScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const chapterId = Array.isArray(id) ? id[0] : id;
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [insightModalVisible, setInsightModalVisible] = useState(false);
    const [insightTitle, setInsightTitle] = useState("");
    const [insightBody, setInsightBody] = useState("");
    const [loadingInsight, setLoadingInsight] = useState(false);

    const loadChapter = useCallback(async () => {
        try {
            if (!chapterId) {
                throw new Error("Missing chapter ID");
            }
            const data = await apiClient.getChapter(chapterId);
            setChapter(data);
        } catch {
            Alert.alert("Error", "Failed to load chapter. Please try again.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [chapterId, router]);

    useEffect(() => {
        if (chapterId) {
            loadChapter();
        } else {
            setLoading(false);
        }
    }, [chapterId, loadChapter]);

    const handleStartQuiz = () => {
        if (!chapterId) return;
        router.push(`/(tabs)/learn/${chapterId}/quiz`);
    };

    const showInsight = (title: string, data: unknown) => {
        setInsightTitle(title);
        setInsightBody(JSON.stringify(data, null, 2));
        setInsightModalVisible(true);
    };

    const handleViewPdf = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const pdf = await apiClient.getChapterPdf(chapterId);
            showInsight("Chapter PDF", pdf);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter PDF.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const handleViewLessons = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const lessons = await apiClient.getChapterLessons(chapterId);
            showInsight("Chapter Lessons", lessons);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter lessons.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const handleViewProgress = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const progress = await apiClient.getChapterProgress(chapterId);
            showInsight("Chapter Progress", progress);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch chapter progress.");
        } finally {
            setLoadingInsight(false);
        }
    };

    const handleUnlockChapter = async () => {
        if (!chapterId) return;
        setLoadingInsight(true);
        try {
            const result = await apiClient.unlockChapter(chapterId);
            showInsight("Unlock Chapter", result);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to unlock chapter.");
        } finally {
            setLoadingInsight(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B138" />
                <Text style={styles.loadingText}>Loading chapter...</Text>
            </View>
        );
    }

    if (!chapter) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Chapter not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chapter</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <ChapterHeader chapter={chapter} />
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewPdf} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewLessons} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>Lessons</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewProgress} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleUnlockChapter} disabled={loadingInsight}>
                        <Text style={styles.actionButtonText}>Unlock</Text>
                    </TouchableOpacity>
                </View>

                {chapter.content.map((section) => (
                    <ContentSection key={section.id} section={section} />
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
                    <Text style={styles.quizButtonText}>Start Quiz</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={insightModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setInsightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{insightTitle}</Text>
                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.modalBody}>{insightBody || "No data."}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.quizButton} onPress={() => setInsightModalVisible(false)}>
                            <Text style={styles.quizButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },
    actionButton: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#fff",
    },
    actionButtonText: {
        fontSize: 12,
        color: "#333",
        fontWeight: "700",
    },
    footer: {
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    quizButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    quizButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        maxHeight: "85%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 10,
    },
    modalScroll: {
        maxHeight: 320,
        marginBottom: 12,
    },
    modalBody: {
        fontSize: 12,
        color: "#444",
        lineHeight: 18,
    },
});
