import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chapter, LessonWithProgress } from "@/lib/types";

interface ChapterHeaderProps {
    chapter: Chapter;
    lessons?: LessonWithProgress[];
}

export default function ChapterHeader({ chapter, lessons }: ChapterHeaderProps) {
    const totalMinutes = lessons && lessons.length > 0
        ? lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
        : chapter.estimatedMinutes ?? 15;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{chapter.title}</Text>
            {chapter.description ? <Text style={styles.description}>{chapter.description}</Text> : null}
            <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{totalMinutes} min</Text>
                </View>
                {lessons && lessons.length > 0 && (
                    <View style={styles.metaItem}>
                        <Ionicons name="document-text-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{lessons.length} lessons</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#282F2E",
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
        marginBottom: 16,
    },
    metaContainer: {
        flexDirection: "row",
        gap: 16,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 14,
        color: "#666",
    },
});
