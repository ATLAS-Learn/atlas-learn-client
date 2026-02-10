import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChapterSection } from "@/lib/types";

interface ContentSectionProps {
    section: ChapterSection;
}

export default function ContentSection({ section }: ContentSectionProps) {
    const handleLinkPress = async (url: string, title: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", `Cannot open this link: ${title}`);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to open link. Please try again.");
        }
    };

    const getLinkIcon = (type: string) => {
        switch (type) {
            case "video":
                return "play-circle";
            case "document":
                return "document-text";
            case "article":
                return "newspaper";
            default:
                return "link";
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
            {section.imageUrl && (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Image: {section.imageUrl}</Text>
                </View>
            )}
            {section.externalLinks && section.externalLinks.length > 0 && (
                <View style={styles.linksContainer}>
                    <Text style={styles.linksTitle}>External Resources</Text>
                    {section.externalLinks.map((link) => (
                        <TouchableOpacity
                            key={link.id}
                            style={styles.linkButton}
                            onPress={() => handleLinkPress(link.url, link.title)}
                        >
                            <Ionicons
                                name={getLinkIcon(link.type) as any}
                                size={20}
                                color="#F2B138"
                            />
                            <Text style={styles.linkText}>{link.title}</Text>
                            <Ionicons name="open-outline" size={16} color="#999" />
                        </TouchableOpacity>
                    ))}
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
    linksContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "#FFF9E6",
        borderRadius: 12,
    },
    linksTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 12,
    },
    linkButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    linkText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#282F2E",
    },
});
