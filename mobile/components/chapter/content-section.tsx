import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChapterSection } from "@/services/types";

interface ContentSectionProps {
    section: ChapterSection;
}

export default function ContentSection({ section }: ContentSectionProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
            {section.imageUrl && (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Image: {section.imageUrl}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
        marginBottom: 16,
    },
    imagePlaceholder: {
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        marginTop: 8,
    },
    imagePlaceholderText: {
        fontSize: 14,
        color: "#999",
        fontStyle: "italic",
    },
});

