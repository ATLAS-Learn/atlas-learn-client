import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { AssessmentAdminItem, AssessmentAdminQuestion } from "@/lib/types";

export default function AdminAssessmentsScreen() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentDescription, setAssessmentDescription] = useState("");

  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentAdminItem | null>(null);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState("");
  const [questionOrder, setQuestionOrder] = useState("");

  const loadAssessments = useCallback(async () => {
    try {
      const data = await apiClient.getAssessments();
      setAssessments(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load assessments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssessments();
  };

  const resetAssessmentForm = () => {
    setEditingAssessmentId(null);
    setAssessmentTitle("");
    setAssessmentDescription("");
  };

  const openCreateAssessment = () => {
    resetAssessmentForm();
    setAssessmentModalOpen(true);
  };

  const openEditAssessment = (assessment: AssessmentAdminItem) => {
    setEditingAssessmentId(assessment.id);
    setAssessmentTitle(assessment.title || "");
    setAssessmentDescription(assessment.description || "");
    setAssessmentModalOpen(true);
  };

  const handleSaveAssessment = async () => {
    if (!assessmentTitle.trim()) {
      Alert.alert("Missing Title", "Assessment title is required.");
      return;
    }
    if (!assessmentDescription.trim()) {
      Alert.alert("Missing Description", "Assessment description is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingAssessmentId) {
        await apiClient.updateAssessment(editingAssessmentId, {
          title: assessmentTitle.trim(),
          description: assessmentDescription.trim(),
        });
      } else {
        await apiClient.createAssessment({
          title: assessmentTitle.trim(),
          description: assessmentDescription.trim(),
        });
      }

      setAssessmentModalOpen(false);
      resetAssessmentForm();
      await loadAssessments();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = (assessment: AssessmentAdminItem) => {
    Alert.alert("Delete Assessment", `Delete "${assessment.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(assessment.id);
          try {
            await apiClient.deleteAssessment(assessment.id);
            setAssessments((prev) => prev.filter((a) => a.id !== assessment.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete assessment.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const openQuestionsManager = async (assessment: AssessmentAdminItem) => {
    try {
      setSaving(true);
      const fullAssessment = await apiClient.getAssessmentById(assessment.id);
      setSelectedAssessment(fullAssessment);
      setQuestionsModalOpen(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load assessment details.");
    } finally {
      setSaving(false);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setQuestionOptions("");
    setQuestionOrder("");
  };

  const fillQuestionForm = (question: AssessmentAdminQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.questionText || "");
    setQuestionOptions((question.options || []).join(", "));
    setQuestionOrder(String(question.orderIndex ?? ""));
  };

  const refreshSelectedAssessment = async () => {
    if (!selectedAssessment?.id) return;
    const refreshed = await apiClient.getAssessmentById(selectedAssessment.id);
    setSelectedAssessment(refreshed);
    await loadAssessments();
  };

  const parsedOptions = useMemo(
    () => questionOptions.split(",").map((v) => v.trim()).filter(Boolean),
    [questionOptions]
  );

  const handleSaveQuestion = async () => {
    if (!selectedAssessment?.id) return;
    if (!questionText.trim()) {
      Alert.alert("Missing Question", "Question text is required.");
      return;
    }
    if (parsedOptions.length < 2) {
      Alert.alert("Options Required", "Provide at least 2 options separated by commas.");
      return;
    }

    const orderIndex = Number(questionOrder);
    if (!Number.isInteger(orderIndex) || orderIndex < 0) {
      Alert.alert("Invalid Order", "Order index must be a non-negative integer.");
      return;
    }

    setQuestionSaving(true);
    try {
      if (editingQuestionId) {
        await apiClient.updateAssessmentQuestion(selectedAssessment.id, editingQuestionId, {
          questionText: questionText.trim(),
          options: parsedOptions,
          orderIndex,
        });
      } else {
        await apiClient.createAssessmentQuestion(selectedAssessment.id, {
          questionText: questionText.trim(),
          options: parsedOptions,
          orderIndex,
        });
      }
      resetQuestionForm();
      await refreshSelectedAssessment();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save question.");
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = (question: AssessmentAdminQuestion) => {
    if (!selectedAssessment?.id) return;
    Alert.alert("Delete Question", "Are you sure you want to delete this question?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setQuestionSaving(true);
          try {
            await apiClient.deleteAssessmentQuestion(selectedAssessment.id, question.id);
            await refreshSelectedAssessment();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete question.");
          } finally {
            setQuestionSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading assessments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment Admin</Text>
        <TouchableOpacity onPress={openCreateAssessment} style={styles.addButton}>
          <Ionicons name="add" size={22} color="#F2B138" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {assessments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No assessments yet</Text>
          </View>
        ) : (
          assessments.map((assessment) => (
            <View key={assessment.id} style={styles.card}>
              <Text style={styles.cardTitle}>{assessment.title}</Text>
              <Text style={styles.cardDescription}>{assessment.description}</Text>
              <Text style={styles.metaText}>Questions: {assessment.questionCount ?? assessment.questions?.length ?? 0}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => openQuestionsManager(assessment)}
                  disabled={saving}
                >
                  <Text style={styles.smallButtonText}>Questions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => openEditAssessment(assessment)}
                  disabled={saving}
                >
                  <Text style={styles.smallButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.deleteButton]}
                  onPress={() => handleDeleteAssessment(assessment)}
                  disabled={deletingId === assessment.id}
                >
                  {deletingId === assessment.id ? (
                    <ActivityIndicator size="small" color="#EF9A9A" />
                  ) : (
                    <Text style={[styles.smallButtonText, styles.deleteButtonText]}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={assessmentModalOpen} transparent animationType="slide" onRequestClose={() => setAssessmentModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingAssessmentId ? "Edit Assessment" : "Create Assessment"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={assessmentTitle}
              onChangeText={setAssessmentTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={assessmentDescription}
              onChangeText={setAssessmentDescription}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssessmentModalOpen(false)} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveAssessment} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={questionsModalOpen}
        animationType="slide"
        onRequestClose={() => {
          setQuestionsModalOpen(false);
          setSelectedAssessment(null);
          resetQuestionForm();
        }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setQuestionsModalOpen(false);
                setSelectedAssessment(null);
                resetQuestionForm();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Questions</Text>
            <View style={styles.backButton} />
          </View>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <Text style={styles.cardTitle}>{selectedAssessment?.title}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Question text"
              value={questionText}
              onChangeText={setQuestionText}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Options (comma separated)"
              value={questionOptions}
              onChangeText={setQuestionOptions}
            />
            <TextInput
              style={styles.input}
              placeholder="Order index (0,1,2...)"
              keyboardType="number-pad"
              value={questionOrder}
              onChangeText={setQuestionOrder}
            />
            <View style={styles.modalActions}>
              {editingQuestionId ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={resetQuestionForm} disabled={questionSaving}>
                  <Text style={styles.cancelText}>Cancel Edit</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveQuestion} disabled={questionSaving}>
                {questionSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>{editingQuestionId ? "Update Question" : "Add Question"}</Text>
                )}
              </TouchableOpacity>
            </View>

            {(selectedAssessment?.questions || []).map((question) => (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionText}>
                  {question.orderIndex}. {question.questionText}
                </Text>
                <Text style={styles.optionsText}>{(question.options || []).join(" | ")}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.smallButton} onPress={() => fillQuestionForm(question)} disabled={questionSaving}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.deleteButton]}
                    onPress={() => handleDeleteQuestion(question)}
                    disabled={questionSaving}
                  >
                    <Text style={[styles.smallButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  addButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#282F2E" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  emptyContainer: { marginTop: 64, alignItems: "center" },
  emptyText: { marginTop: 10, color: "#999", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#282F2E" },
  cardDescription: { marginTop: 6, color: "#666", fontSize: 14 },
  metaText: { marginTop: 8, color: "#777", fontSize: 12, fontWeight: "600" },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  smallButtonText: { color: "#333", fontWeight: "600", fontSize: 13 },
  deleteButton: { borderColor: "#FFEBEE" },
  deleteButtonText: { color: "#EF9A9A" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#282F2E", marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FAFAFA",
    marginBottom: 10,
    color: "#282F2E",
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, gap: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  cancelText: { color: "#666", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#F2B138",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 108,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginTop: 12,
  },
  questionText: { fontSize: 15, fontWeight: "700", color: "#282F2E" },
  optionsText: { marginTop: 6, fontSize: 13, color: "#666" },
});
