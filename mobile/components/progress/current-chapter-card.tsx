import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "@/lib/types";

interface CurrentChapterCardProps {
    chapter: Chapter;
    onPress: () => void;
}

export default function CurrentChapterCard({
    chapter,
    onPress,
}: CurrentChapterCardProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="book" size={32} color="#F2B138" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Current Chapter</Text>
                    <Text style={styles.title}>{chapter.title}</Text>
                    <Text style={styles.description} numberOfLines={2}>
                        {chapter.description}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
            </View>
            <View style={styles.footer}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{chapter.estimatedTime} min</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="layers-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{chapter.content.length} sections</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FFF9E6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    footer: {
        flexDirection: "row",
        gap: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: "#666",
    },
});
