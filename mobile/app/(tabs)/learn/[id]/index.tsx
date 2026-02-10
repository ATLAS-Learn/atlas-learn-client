import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { Chapter } from "@/lib/types";
import ChapterHeader from "@/components/lessons/chapter-header";
import ContentSection from "@/components/lessons/content-section";
import { useProgressStore } from "@/lib/store/progress";

export default function ChapterScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const { completeLesson } = useProgressStore();

    useEffect(() => {
        if (id) {
            loadChapter();
        }
    }, [id]);

    useEffect(() => {
        // Mark all lessons in this chapter as completed when chapter is viewed
        if (chapter?.content) {
            chapter.content.forEach((section) => {
                completeLesson(section.id);
            });
        }
    }, [chapter, completeLesson]);

    const loadChapter = async () => {
        try {
            const data = await apiClient.getChapter(id!);
            setChapter(data);
        } catch {
            Alert.alert("Error", "Failed to load chapter. Please try again.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = () => {
        router.push(`/(tabs)/learn/${id}/quiz`);
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
});
