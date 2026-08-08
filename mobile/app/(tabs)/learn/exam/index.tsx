import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import ScreenHeader from "@/components/ui/screen-header";
import { useFocusEffect } from "@react-navigation/native";

export default function ExamListScreen() {
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadExams = useCallback(async () => {
        try {
            const data = await apiClient.getExams();
            setExams(data);
        } catch {} finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadExams();
        }, [loadExams])
    );

    const handleStartExam = (exam: any) => {
        if (!exam.isPublished) return;
        router.push({
            pathname: "/(tabs)/learn/exam/[id]",
            params: { id: exam.id },
        });
    };

    const renderExam = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.examCard}
            onPress={() => handleStartExam(item)}
            activeOpacity={0.7}
        >
            <View style={styles.examHeader}>
                <View style={styles.examIcon}>
                    <Ionicons name="school-outline" size={24} color="#F2B138" />
                </View>
                <View style={styles.examInfo}>
                    <Text style={styles.examTitle}>{item.title}</Text>
                    <Text style={styles.examMeta}>
                        {item.subject?.name || "General"} · {item._count?.questions ?? 0} questions
                        {item.timeLimit ? ` · ${Math.round(item.timeLimit / 60)} min` : ""}
                    </Text>
                </View>
            </View>
            {item.description && (
                <Text style={styles.examDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
            <View style={styles.examFooter}>
                <Text style={styles.attemptsText}>
                    {item._count?.attempts ?? 0} attempts
                </Text>
                <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>Start Exam</Text>
                    <Ionicons name="arrow-forward" size={14} color="#F2B138" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader title="Exams" />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            ) : exams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyTitle}>No Exams Available</Text>
                    <Text style={styles.emptySubtitle}>
                        Exams created by your teachers will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={exams}
                    renderItem={renderExam}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    },
    listContent: {
        padding: 16,
    },
    examCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    examHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    examIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#F2B13815",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    examInfo: {
        flex: 1,
    },
    examTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2524",
    },
    examMeta: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    examDescription: {
        fontSize: 13,
        color: "#666",
        marginTop: 12,
        lineHeight: 18,
    },
    examFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F5F5F5",
    },
    attemptsText: {
        fontSize: 12,
        color: "#999",
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    startButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#F2B138",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F2524",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#999",
        marginTop: 8,
        textAlign: "center",
    },
});
