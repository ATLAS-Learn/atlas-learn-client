import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SectionList,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";

interface ExamItem {
    id: string;
    title: string;
    description?: string;
    isPublished: boolean;
    timeLimit?: number;
    subject?: { id: string; name: string; code: string };
    _count?: { questions: number; attempts: number };
    userAttempt?: { id: string; score: number; completedAt: string } | null;
}

interface SubjectSection {
    title: string;
    subjectId: string;
    data: ExamItem[];
}

export default function ExamListScreen() {
    const router = useRouter();
    const [sections, setSections] = useState<SubjectSection[]>([]);
    const [loading, setLoading] = useState(true);

    const loadExams = useCallback(async () => {
        try {
            const data: ExamItem[] = await apiClient.getExams();
            const grouped: Record<string, ExamItem[]> = {};
            for (const exam of data) {
                const key = exam.subject?.id || "general";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(exam);
            }
            const result: SubjectSection[] = Object.entries(grouped).map(([key, exams]) => ({
                title: key === "general" ? "General" : (exams[0]?.subject?.name || "Unknown"),
                subjectId: key,
                data: exams,
            }));
            result.sort((a, b) => {
                if (a.subjectId === "general") return 1;
                if (b.subjectId === "general") return -1;
                return a.title.localeCompare(b.title);
            });
            setSections(result);
        } catch {} finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadExams();
        }, [loadExams])
    );

    const handleStartExam = (exam: ExamItem) => {
        if (!exam.isPublished) return;
        if (exam.userAttempt) {
            router.push({
                pathname: "/(tabs)/exams/result/[id]" as any,
                params: { id: exam.id },
            });
        } else {
            router.push({
                pathname: "/(tabs)/exams/[id]" as any,
                params: { id: exam.id },
            });
        }
    };

    const renderExam = ({ item }: { item: ExamItem }) => (
        <TouchableOpacity
            style={styles.examCard}
            onPress={() => handleStartExam(item)}
            activeOpacity={0.7}
        >
            <View style={styles.examHeader}>
                <View style={styles.examIcon}>
                    <Ionicons name="document-text-outline" size={22} color="#F2B138" />
                </View>
                <View style={styles.examInfo}>
                    <Text style={styles.examTitle}>{item.title}</Text>
                    <Text style={styles.examMeta}>
                        {item._count?.questions ?? 0} questions
                        {item.timeLimit ? ` · ${Math.round(item.timeLimit / 60)} min` : ""}
                    </Text>
                </View>
            </View>
            {item.description && (
                <Text style={styles.examDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
            {item.userAttempt && (
                <View style={styles.attemptBadge}>
                    <Ionicons
                        name={item.userAttempt.score >= 70 ? "checkmark-circle" : "close-circle"}
                        size={14}
                        color={item.userAttempt.score >= 70 ? "#16A34A" : "#DC2626"}
                    />
                    <Text style={[styles.attemptBadgeText, { color: item.userAttempt.score >= 70 ? "#16A34A" : "#DC2626" }]}>
                        Score: {item.userAttempt.score}%
                    </Text>
                </View>
            )}
            <View style={styles.examFooter}>
                <Text style={styles.attemptsText}>
                    {item._count?.attempts ?? 0} attempts
                </Text>
                <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>
                        {item.userAttempt ? "View Result" : "Start Exam"}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#F2B138" />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section }: { section: SubjectSection }) => (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F2B138" />
                </View>
            ) : sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyTitle}>No Exams Available</Text>
                    <Text style={styles.emptySubtitle}>
                        Exams created by your teachers will appear here.
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    renderItem={renderExam}
                    renderSectionHeader={renderSectionHeader}
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
        paddingBottom: 32,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        marginBottom: 10,
        paddingTop: 8,
    },
    sectionDot: {
        width: 4,
        height: 20,
        borderRadius: 2,
        backgroundColor: "#F2B138",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2524",
        flex: 1,
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: "600",
        color: "#999",
        backgroundColor: "#F0F0F0",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    examCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    examHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    examIcon: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#F2B13815",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    examInfo: {
        flex: 1,
    },
    examTitle: {
        fontSize: 15,
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
        marginTop: 10,
        lineHeight: 18,
    },
    examFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#F5F5F5",
    },
    attemptsText: {
        fontSize: 12,
        color: "#999",
    },
    attemptBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 8,
    },
    attemptBadgeText: {
        fontSize: 12,
        fontWeight: "700",
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
