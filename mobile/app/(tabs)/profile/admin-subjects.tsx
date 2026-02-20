import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import {
  Subject,
  SubjectChapter,
  SubjectQueryOptions,
  SubjectStats,
} from "@/lib/types";
import { useCreateSubject, useDeleteSubject, useSubjects, useUpdateSubject } from "@/lib/hooks/api";

function parseOptionalInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return undefined;
  return parsed;
}

export default function AdminSubjectsScreen() {
  const router = useRouter();
  const [includeChapters, setIncludeChapters] = useState(false);
  const [includeChapterDetails, setIncludeChapterDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [searchCode, setSearchCode] = useState("");
  const [searchingByCode, setSearchingByCode] = useState(false);
  const [subjectByCode, setSubjectByCode] = useState<Subject | null>(null);

  const [chaptersModalOpen, setChaptersModalOpen] = useState(false);
  const [chaptersSubject, setChaptersSubject] = useState<Subject | null>(null);
  const [subjectChapters, setSubjectChapters] = useState<SubjectChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);

  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [chapterOrderIndex, setChapterOrderIndex] = useState("");
  const [chapterUnlockThreshold, setChapterUnlockThreshold] = useState("");
  const [chapterEstimatedMinutes, setChapterEstimatedMinutes] = useState("");
  const [chapterPdfUrl, setChapterPdfUrl] = useState("");

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsSubject, setStatsSubject] = useState<Subject | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [chapterDataModalOpen, setChapterDataModalOpen] = useState(false);
  const [chapterDataModalTitle, setChapterDataModalTitle] = useState("");
  const [chapterDataModalBody, setChapterDataModalBody] = useState("");

  const queryOptions = useMemo<SubjectQueryOptions>(
    () => ({
      includeChapters,
      includeChapterDetails: includeChapters ? includeChapterDetails : false,
    }),
    [includeChapters, includeChapterDetails]
  );

  const {
    data: subjects = [],
    isLoading,
    isFetching,
    refetch,
  } = useSubjects(queryOptions);

  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  useEffect(() => {
    if (!includeChapters && includeChapterDetails) {
      setIncludeChapterDetails(false);
    }
  }, [includeChapters, includeChapterDetails]);

  const resetSubjectForm = () => {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectCode("");
    setSubjectDescription("");
  };

  const resetChapterForm = () => {
    setEditingChapterId(null);
    setChapterTitle("");
    setChapterDescription("");
    setChapterOrderIndex("");
    setChapterUnlockThreshold("");
    setChapterEstimatedMinutes("");
    setChapterPdfUrl("");
  };

  const openCreateSubject = () => {
    resetSubjectForm();
    setSubjectModalOpen(true);
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name || "");
    setSubjectCode(subject.code || "");
    setSubjectDescription(typeof subject.description === "string" ? subject.description : "");
    setSubjectModalOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSaveSubject = async () => {
    if (!subjectName.trim()) {
      Alert.alert("Missing Name", "Subject name is required.");
      return;
    }
    if (!subjectCode.trim()) {
      Alert.alert("Missing Code", "Subject code is required.");
      return;
    }

    try {
      if (editingSubject?.id) {
        await updateSubjectMutation.mutateAsync({
          subjectId: editingSubject.id,
          data: {
            name: subjectName.trim(),
            code: subjectCode.trim(),
            description: subjectDescription.trim() || undefined,
          },
        });
      } else {
        await createSubjectMutation.mutateAsync({
          name: subjectName.trim(),
          code: subjectCode.trim(),
          description: subjectDescription.trim() || undefined,
        });
      }

      setSubjectModalOpen(false);
      resetSubjectForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save subject.");
    }
  };

  const handleDeleteSubject = (subject: Subject) => {
    Alert.alert("Delete Subject", `Delete "${subject.name}" (${subject.code})?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSubjectMutation.mutateAsync(subject.id);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete subject.");
          }
        },
      },
    ]);
  };

  const handleOpenSubjectDetails = async (subjectId: string) => {
    setLoadingDetails(true);
    try {
      const data = await apiClient.getSubjectById(subjectId, queryOptions);
      setSelectedSubject(data);
      setDetailsModalOpen(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load subject details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      Alert.alert("Missing Code", "Enter a subject code to search.");
      return;
    }
    setSearchingByCode(true);
    try {
      const data = await apiClient.getSubjectByCode(searchCode.trim(), queryOptions);
      setSubjectByCode(data);
    } catch (error: any) {
      setSubjectByCode(null);
      Alert.alert("Error", error.message || "Failed to find subject by code.");
    } finally {
      setSearchingByCode(false);
    }
  };

  const loadSubjectChapters = async (subjectId: string) => {
    setLoadingChapters(true);
    try {
      const chapters = await apiClient.getSubjectChapters(subjectId);
      setSubjectChapters(chapters || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load subject chapters.");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleOpenChaptersManager = async (subject: Subject) => {
    setChaptersSubject(subject);
    resetChapterForm();
    setChaptersModalOpen(true);
    await loadSubjectChapters(subject.id);
  };

  const openEditChapter = (chapter: SubjectChapter) => {
    setEditingChapterId(chapter.id);
    setChapterTitle((chapter.title as string) || "");
    setChapterDescription((chapter.description as string) || "");
    setChapterOrderIndex(
      typeof chapter.orderIndex === "number" ? String(chapter.orderIndex) : ""
    );
    setChapterUnlockThreshold(
      typeof chapter.unlockThreshold === "number" ? String(chapter.unlockThreshold) : ""
    );
    setChapterEstimatedMinutes(
      typeof chapter.estimatedMinutes === "number" ? String(chapter.estimatedMinutes) : ""
    );
    setChapterPdfUrl((chapter.pdfUrl as string) || "");
  };

  const handleSaveChapter = async () => {
    if (!chaptersSubject?.id) return;
    if (!chapterTitle.trim()) {
      Alert.alert("Missing Title", "Chapter title is required.");
      return;
    }

    const orderIndex = parseOptionalInteger(chapterOrderIndex);
    const unlockThreshold = parseOptionalInteger(chapterUnlockThreshold);
    const estimatedMinutes = parseOptionalInteger(chapterEstimatedMinutes);

    if (chapterOrderIndex.trim() && orderIndex === undefined) {
      Alert.alert("Invalid Order", "Order Index must be an integer.");
      return;
    }
    if (chapterUnlockThreshold.trim() && unlockThreshold === undefined) {
      Alert.alert("Invalid Threshold", "Unlock Threshold must be an integer.");
      return;
    }
    if (chapterEstimatedMinutes.trim() && estimatedMinutes === undefined) {
      Alert.alert("Invalid Minutes", "Estimated Minutes must be an integer.");
      return;
    }

    const payload = {
      title: chapterTitle.trim(),
      description: chapterDescription.trim() || undefined,
      orderIndex,
      unlockThreshold,
      estimatedMinutes,
      pdfUrl: chapterPdfUrl.trim() || undefined,
    };

    setSavingChapter(true);
    try {
      if (editingChapterId) {
        await apiClient.updateChapter(editingChapterId, payload);
      } else {
        await apiClient.createSubjectChapter(chaptersSubject.id, payload);
      }
      resetChapterForm();
      await loadSubjectChapters(chaptersSubject.id);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save chapter.");
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteChapter = (chapter: SubjectChapter) => {
    if (!chaptersSubject?.id) return;

    Alert.alert("Delete Chapter", `Delete "${chapter.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingChapterId(chapter.id);
          try {
            await apiClient.deleteChapter(chapter.id);
            await loadSubjectChapters(chaptersSubject.id);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete chapter.");
          } finally {
            setDeletingChapterId(null);
          }
        },
      },
    ]);
  };

  const handleViewChapterDetails = async (chapterId: string) => {
    if (!chaptersSubject?.id) return;

    try {
      const chapter = await apiClient.getSubjectChapter(chaptersSubject.id, chapterId);
      Alert.alert(
        "Chapter Details",
        `Title: ${chapter.title || "-"}\nID: ${chapter.id || "-"}\nOrder: ${chapter.orderIndex ?? "-"}\nMinutes: ${chapter.estimatedMinutes ?? "-"}`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load chapter details.");
    }
  };

  const handleOpenSubjectStats = async (subject: Subject) => {
    setStatsSubject(subject);
    setStatsModalOpen(true);
    setLoadingStats(true);
    try {
      const stats = await apiClient.getSubjectStats(subject.id);
      setSubjectStats(stats);
    } catch (error: any) {
      setSubjectStats(null);
      Alert.alert("Error", error.message || "Failed to load subject statistics.");
    } finally {
      setLoadingStats(false);
    }
  };

  const openChapterDataModal = (title: string, data: unknown) => {
    setChapterDataModalTitle(title);
    setChapterDataModalBody(JSON.stringify(data, null, 2));
    setChapterDataModalOpen(true);
  };

  const handleViewChapterQuizzes = async (chapter: SubjectChapter) => {
    if (!chaptersSubject?.id) return;
    try {
      const quizzes = await apiClient.getSubjectChapterQuizzes(chaptersSubject.id, chapter.id);
      openChapterDataModal(`Quizzes: ${chapter.title}`, quizzes);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load chapter quizzes.");
    }
  };

  const handleViewChapterProgress = async (chapter: SubjectChapter) => {
    if (!chaptersSubject?.id) return;
    try {
      const progress = await apiClient.getSubjectChapterProgress(chaptersSubject.id, chapter.id);
      openChapterDataModal(`Progress: ${chapter.title}`, progress);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load chapter progress.");
    }
  };

  const handleUnlockChapter = async (chapter: SubjectChapter) => {
    if (!chaptersSubject?.id) return;
    try {
      const response = await apiClient.unlockSubjectChapter(chaptersSubject.id, chapter.id);
      openChapterDataModal(`Unlock: ${chapter.title}`, response);
      await loadSubjectChapters(chaptersSubject.id);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to unlock chapter.");
    }
  };

  const handleViewExamHints = async (chapter: SubjectChapter) => {
    if (!chaptersSubject?.id) return;
    try {
      const hints = await apiClient.getSubjectChapterExamHints(chaptersSubject.id, chapter.id);
      openChapterDataModal(`Exam Hints: ${chapter.title}`, hints);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load exam hints.");
    }
  };

  const isSaving = createSubjectMutation.isPending || updateSubjectMutation.isPending;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subject Admin</Text>
        <TouchableOpacity onPress={openCreateSubject} style={styles.addButton}>
          <Ionicons name="add" size={22} color="#F2B138" />
        </TouchableOpacity>
      </View>

      <View style={styles.optionsCard}>
        <Text style={styles.optionsTitle}>Fetch Options</Text>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>includeChapters</Text>
          <Switch value={includeChapters} onValueChange={setIncludeChapters} />
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>includeChapterDetails</Text>
          <Switch
            value={includeChapterDetails}
            onValueChange={setIncludeChapterDetails}
            disabled={!includeChapters}
          />
        </View>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.optionsTitle}>Lookup by Code</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. CS-ALEVEL"
            value={searchCode}
            onChangeText={setSearchCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchByCode} disabled={searchingByCode}>
            {searchingByCode ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Find</Text>
            )}
          </TouchableOpacity>
        </View>
        {subjectByCode && (
          <TouchableOpacity style={styles.lookupResultCard} onPress={() => handleOpenSubjectDetails(subjectByCode.id)}>
            <Text style={styles.lookupTitle}>{subjectByCode.name}</Text>
            <Text style={styles.lookupMeta}>Code: {subjectByCode.code}</Text>
            <Text style={styles.lookupMeta}>ID: {subjectByCode.id}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No subjects yet</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.id} style={styles.card}>
              <Text style={styles.cardTitle}>{subject.name}</Text>
              <Text style={styles.metaText}>Code: {subject.code}</Text>
              {!!subject.description && <Text style={styles.cardDescription}>{subject.description}</Text>}
              {!!subject.createdAt && <Text style={styles.metaText}>Created: {new Date(subject.createdAt).toLocaleDateString()}</Text>}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.smallButton} onPress={() => handleOpenSubjectDetails(subject.id)} disabled={loadingDetails}>
                  <Text style={styles.smallButtonText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => handleOpenChaptersManager(subject)}>
                  <Text style={styles.smallButtonText}>Chapters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => handleOpenSubjectStats(subject)}>
                  <Text style={styles.smallButtonText}>Stats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => openEditSubject(subject)} disabled={isSaving}>
                  <Text style={styles.smallButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.deleteButton]}
                  onPress={() => handleDeleteSubject(subject)}
                  disabled={deleteSubjectMutation.isPending}
                >
                  {deleteSubjectMutation.isPending ? (
                    <ActivityIndicator size="small" color="#F44336" />
                  ) : (
                    <Text style={[styles.smallButtonText, styles.deleteButtonText]}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {isFetching && <ActivityIndicator size="small" color="#F2B138" style={styles.fetchingIndicator} />}
      </ScrollView>

      <Modal visible={subjectModalOpen} transparent animationType="slide" onRequestClose={() => setSubjectModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingSubject ? "Edit Subject" : "Create Subject"}</Text>
            <TextInput style={styles.input} placeholder="Name" value={subjectName} onChangeText={setSubjectName} />
            <TextInput
              style={styles.input}
              placeholder="Code (e.g. CS-ALEVEL)"
              value={subjectCode}
              onChangeText={setSubjectCode}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={subjectDescription}
              onChangeText={setSubjectDescription}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSubjectModalOpen(false)} disabled={isSaving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveSubject} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={detailsModalOpen} transparent animationType="slide" onRequestClose={() => setDetailsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Subject Details</Text>
            {selectedSubject ? (
              <View>
                <Text style={styles.detailLine}>Name: {selectedSubject.name}</Text>
                <Text style={styles.detailLine}>Code: {selectedSubject.code}</Text>
                <Text style={styles.detailLine}>ID: {selectedSubject.id}</Text>
                <Text style={styles.detailLine}>Description: {selectedSubject.description || "-"}</Text>
                <Text style={styles.detailLine}>
                  Chapters Loaded: {Array.isArray(selectedSubject.chapters) ? selectedSubject.chapters.length : 0}
                </Text>
              </View>
            ) : (
              <Text style={styles.metaText}>No subject data loaded.</Text>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={() => setDetailsModalOpen(false)}>
              <Text style={styles.submitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={chaptersModalOpen} transparent animationType="slide" onRequestClose={() => setChaptersModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.largeModalCard]}>
            <Text style={styles.modalTitle}>Subject Chapters{chaptersSubject ? `: ${chaptersSubject.name}` : ""}</Text>

            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => {
                  if (!chaptersSubject?.id) return;
                  loadSubjectChapters(chaptersSubject.id);
                }}
                disabled={loadingChapters}
              >
                <Text style={styles.smallButtonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={resetChapterForm}>
                <Text style={styles.smallButtonText}>{editingChapterId ? "Cancel Edit" : "Clear Form"}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Chapter Title"
              value={chapterTitle}
              onChangeText={setChapterTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Chapter Description (optional)"
              value={chapterDescription}
              onChangeText={setChapterDescription}
              multiline
            />

            <View style={styles.twoColumnRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Order Index"
                value={chapterOrderIndex}
                onChangeText={setChapterOrderIndex}
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Unlock Threshold"
                value={chapterUnlockThreshold}
                onChangeText={setChapterUnlockThreshold}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.twoColumnRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Estimated Minutes"
                value={chapterEstimatedMinutes}
                onChangeText={setChapterEstimatedMinutes}
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="PDF URL"
                value={chapterPdfUrl}
                onChangeText={setChapterPdfUrl}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveChapter} disabled={savingChapter}>
              {savingChapter ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>{editingChapterId ? "Update Chapter" : "Create Chapter"}</Text>
              )}
            </TouchableOpacity>

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {loadingChapters ? (
                <ActivityIndicator size="small" color="#F2B138" />
              ) : subjectChapters.length === 0 ? (
                <Text style={styles.metaText}>No chapters found for this subject.</Text>
              ) : (
                subjectChapters.map((chapter) => (
                  <View key={chapter.id} style={styles.chapterCard}>
                    <Text style={styles.cardTitle}>{chapter.title}</Text>
                    <Text style={styles.metaText}>ID: {chapter.id}</Text>
                    <Text style={styles.metaText}>Order: {chapter.orderIndex ?? "-"}</Text>
                    <Text style={styles.metaText}>Minutes: {chapter.estimatedMinutes ?? "-"}</Text>

                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.smallButton} onPress={() => handleViewChapterDetails(chapter.id)}>
                        <Text style={styles.smallButtonText}>Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => handleViewChapterQuizzes(chapter)}>
                        <Text style={styles.smallButtonText}>Quizzes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => handleViewChapterProgress(chapter)}>
                        <Text style={styles.smallButtonText}>Progress</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => handleUnlockChapter(chapter)}>
                        <Text style={styles.smallButtonText}>Unlock</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => handleViewExamHints(chapter)}>
                        <Text style={styles.smallButtonText}>Exam Hints</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => openEditChapter(chapter)}>
                        <Text style={styles.smallButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallButton, styles.deleteButton]}
                        onPress={() => handleDeleteChapter(chapter)}
                        disabled={deletingChapterId === chapter.id}
                      >
                        {deletingChapterId === chapter.id ? (
                          <ActivityIndicator size="small" color="#F44336" />
                        ) : (
                          <Text style={[styles.smallButtonText, styles.deleteButtonText]}>Delete</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setChaptersModalOpen(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={statsModalOpen} transparent animationType="slide" onRequestClose={() => setStatsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Subject Stats{statsSubject ? `: ${statsSubject.name}` : ""}</Text>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#F2B138" />
            ) : subjectStats ? (
              <View>
                <Text style={styles.detailLine}>Subject ID: {String(subjectStats.subjectId || statsSubject?.id || "-")}</Text>
                <Text style={styles.detailLine}>Chapters: {String(subjectStats.chaptersCount ?? "-")}</Text>
                <Text style={styles.detailLine}>Lessons: {String(subjectStats.lessonsCount ?? "-")}</Text>
                <Text style={styles.detailLine}>Quizzes: {String(subjectStats.quizzesCount ?? "-")}</Text>
              </View>
            ) : (
              <Text style={styles.metaText}>No statistics available.</Text>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={() => setStatsModalOpen(false)}>
              <Text style={styles.submitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={chapterDataModalOpen} transparent animationType="slide" onRequestClose={() => setChapterDataModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.largeModalCard]}>
            <Text style={styles.modalTitle}>{chapterDataModalTitle || "Chapter Data"}</Text>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              <Text style={styles.jsonText}>{chapterDataModalBody || "No data."}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setChapterDataModalOpen(false)}>
              <Text style={styles.submitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  optionsCard: { backgroundColor: "#fff", margin: 12, borderRadius: 12, padding: 12 },
  searchCard: { backgroundColor: "#fff", marginHorizontal: 12, marginBottom: 12, borderRadius: 12, padding: 12 },
  optionsTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  optionLabel: { fontSize: 14, color: "#333" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: "#F2B138",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchButtonText: { color: "#fff", fontWeight: "700" },
  lookupResultCard: { marginTop: 10, backgroundColor: "#FFF8E8", borderRadius: 10, padding: 10 },
  lookupTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  lookupMeta: { fontSize: 12, color: "#555", marginTop: 2 },
  scrollView: { flex: 1 },
  content: { padding: 12, paddingBottom: 24 },
  emptyContainer: { alignItems: "center", marginTop: 48 },
  emptyText: { marginTop: 8, color: "#777", fontSize: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  chapterCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#efefef",
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A", marginBottom: 2 },
  cardDescription: { fontSize: 13, color: "#555", marginTop: 6 },
  metaText: { fontSize: 12, color: "#888", marginTop: 3 },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  smallButton: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  smallButtonText: { fontSize: 12, color: "#333", fontWeight: "600" },
  deleteButton: { borderColor: "#FFCDD2" },
  deleteButtonText: { color: "#F44336" },
  fetchingIndicator: { marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  largeModalCard: { maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  halfInput: { flex: 1 },
  twoColumnRow: { flexDirection: "row", gap: 10 },
  textArea: { minHeight: 84, textAlignVertical: "top" },
  inlineActions: { flexDirection: "row", gap: 8, marginBottom: 10 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 2 },
  modalList: { marginTop: 10, maxHeight: 220 },
  modalListContent: { paddingBottom: 8 },
  jsonText: { fontSize: 12, color: "#333", lineHeight: 18 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#F2F2F2",
    alignSelf: "flex-end",
    marginTop: 10,
  },
  cancelText: { color: "#555", fontWeight: "600" },
  submitBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#F2B138",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontWeight: "700" },
  detailLine: { fontSize: 13, color: "#333", marginBottom: 6 },
});
