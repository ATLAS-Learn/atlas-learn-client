import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { Subject } from "@/lib/types";

export default function SelectSubjectsScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const data = await apiClient.getSubjects();
                setSubjects(data);
            } catch {
                Alert.alert("Error", "Failed to load subjects. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        loadSubjects();
    }, []);

    const toggleSubject = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleContinue = async () => {
        if (selectedIds.size === 0) {
            Alert.alert("Select Subjects", "Please select at least one subject to continue.");
            return;
        }
        setSaving(true);
        try {
            await apiClient.updatePreferredSubjects(Array.from(selectedIds));
            router.push("/(onboarding)/assessment");
        } catch {
            Alert.alert("Error", "Failed to save your selections. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const contentPadding = width < 390 ? 16 : 24;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Choose Subjects</Text>
                <View style={styles.backButton} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                    <Text style={styles.loadingText}>Loading subjects...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ padding: contentPadding, paddingTop: 16 }}
                >
                    <Text style={styles.subtitle}>
                        Select the subjects you want to study. You can change these later in your profile.
                    </Text>

                    {subjects.map((subject) => {
                        const isSelected = selectedIds.has(subject.id);
                        return (
                            <TouchableOpacity
                                key={subject.id}
                                style={[styles.subjectCard, isSelected && styles.subjectCardSelected]}
                                onPress={() => toggleSubject(subject.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                                <View style={styles.subjectInfo}>
                                    <Text style={[styles.subjectName, isSelected && styles.subjectNameSelected]}>
                                        {subject.name}
                                    </Text>
                                    <Text style={styles.subjectCode}>{subject.code}</Text>
                                    {subject.description && (
                                        <Text style={styles.subjectDescription} numberOfLines={2}>
                                            {subject.description}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            )}

            <View style={styles.footer}>
                <Text style={styles.selectedCount}>
                    {selectedIds.size} subject{selectedIds.size !== 1 ? "s" : ""} selected
                </Text>
                <TouchableOpacity
                    style={[styles.continueButton, selectedIds.size === 0 && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={saving || selectedIds.size === 0}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#282F2E" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
    scrollView: { flex: 1 },
    subtitle: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
        marginBottom: 20,
    },
    subjectCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#E0E0E0",
        marginBottom: 12,
    },
    subjectCardSelected: {
        borderColor: "#F2B138",
        backgroundColor: "#FFFDF5",
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#CCC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    checkboxSelected: {
        backgroundColor: "#F2B138",
        borderColor: "#F2B138",
    },
    subjectInfo: { flex: 1 },
    subjectName: { fontSize: 16, fontWeight: "700", color: "#282F2E" },
    subjectNameSelected: { color: "#E65100" },
    subjectCode: { fontSize: 12, color: "#999", fontWeight: "600", marginTop: 2 },
    subjectDescription: { fontSize: 13, color: "#777", marginTop: 4, lineHeight: 18 },
    bottomSpacer: { height: 24 },
    footer: {
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    selectedCount: { fontSize: 13, color: "#666", fontWeight: "600", marginBottom: 10, textAlign: "center" },
    continueButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    continueButtonDisabled: { opacity: 0.5 },
    continueButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
