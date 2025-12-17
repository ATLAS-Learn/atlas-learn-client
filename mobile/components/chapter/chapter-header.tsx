import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "@/services/types";

interface ChapterHeaderProps {
    chapter: Chapter;
}

export default function ChapterHeader({ chapter }: ChapterHeaderProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{chapter.title}</Text>
            <Text style={styles.description}>{chapter.description}</Text>
            <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{chapter.estimatedTime} min read</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="layers-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{chapter.content.length} sections</Text>
                </View>
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

