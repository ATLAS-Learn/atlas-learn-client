import React, { useCallback, useEffect, useState } from "react";
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

const CATEGORIES = ["all", "bug", "feature_request", "general", "complaint", "suggestion"] as const;
const STATUSES = ["all", "pending", "reviewed", "resolved"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature Request",
  general: "General",
  complaint: "Complaint",
  suggestion: "Suggestion",
};

const CATEGORY_COLORS: Record<string, string> = {
  bug: "#E57373",
  feature_request: "#64B5F6",
  general: "#999",
  complaint: "#FF8A65",
  suggestion: "#81C784",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFA726",
  reviewed: "#42A5F5",
  resolved: "#66BB6A",
};

export default function AdminFeedbackScreen() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reply modal
  const [replyModal, setReplyModal] = useState<{ visible: boolean; feedback: any | null }>({
    visible: false,
    feedback: null,
  });
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const loadFeedbacks = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        const params: any = { page: pageNum, limit: 20 };
        if (activeCategory !== "all") params.category = activeCategory;
        if (activeStatus !== "all") params.status = activeStatus;

        const result = await apiClient.getAllFeedback(params);

        if (append) {
          setFeedbacks((prev) => [...prev, ...result.data]);
        } else {
          setFeedbacks(result.data);
        }
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
        setPage(pageNum);
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to load feedback.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, activeStatus]
  );

  useEffect(() => {
    setLoading(true);
    loadFeedbacks(1);
  }, [loadFeedbacks]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeedbacks(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      setLoadingMore(true);
      loadFeedbacks(page + 1, true);
    }
  };

  const handleChangeStatus = (feedback: any, newStatus: string) => {
    Alert.alert("Update Status", `Change status to "${newStatus}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          try {
            await apiClient.updateFeedback(feedback.id, { status: newStatus });
            setFeedbacks((prev) =>
              prev.map((f) => (f.id === feedback.id ? { ...f, status: newStatus } : f))
            );
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update status.");
          }
        },
      },
    ]);
  };

  const handleOpenReply = (feedback: any) => {
    setReplyText(feedback.adminReply || "");
    setReplyModal({ visible: true, feedback });
  };

  const handleSendReply = async () => {
    if (!replyModal.feedback) return;
    setReplying(true);
    try {
      await apiClient.updateFeedback(replyModal.feedback.id, {
        adminReply: replyText,
        status: "reviewed",
      });
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === replyModal.feedback.id
            ? { ...f, adminReply: replyText, status: "reviewed" }
            : f
        )
      );
      setReplyModal({ visible: false, feedback: null });
      setReplyText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save reply.");
    } finally {
      setReplying(false);
    }
  };

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter((f) => f.status === "pending").length,
    reviewed: feedbacks.filter((f) => f.status === "reviewed").length,
    resolved: feedbacks.filter((f) => f.status === "resolved").length,
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading feedback...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Feedback</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#FFF3E0" }]}>
            <Text style={[styles.statNumber, { color: "#FFA726" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#E3F2FD" }]}>
            <Text style={[styles.statNumber, { color: "#42A5F5" }]}>{stats.reviewed}</Text>
            <Text style={styles.statLabel}>Reviewed</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#E8F5E9" }]}>
            <Text style={[styles.statNumber, { color: "#66BB6A" }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterChip,
                activeStatus === s && styles.filterChipActive,
                s !== "all" && { borderColor: STATUS_COLORS[s] || "#ccc" },
              ]}
              onPress={() => setActiveStatus(s)}
            >
              <View style={styles.filterChipInner}>
                {s !== "all" && (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[s] || "#999" },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    activeStatus === s && styles.filterChipTextActive,
                  ]}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feedback list */}
        {feedbacks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No feedback found</Text>
          </View>
        ) : (
          feedbacks.map((fb) => (
            <View key={fb.id} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: (CATEGORY_COLORS[fb.category] || "#999") + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: CATEGORY_COLORS[fb.category] || "#999" },
                      ]}
                    >
                      {CATEGORY_LABELS[fb.category] || fb.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: (STATUS_COLORS[fb.status] || "#999") + "20" },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDotSmall,
                        { backgroundColor: STATUS_COLORS[fb.status] || "#999" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: STATUS_COLORS[fb.status] || "#999" },
                      ]}
                    >
                      {fb.status.charAt(0).toUpperCase() + fb.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dateText}>{formatDate(fb.createdAt)}</Text>
              </View>

              {/* Subject */}
              <Text style={styles.cardSubject}>{fb.subject}</Text>

              {/* User info */}
              <View style={styles.userRow}>
                <Ionicons name="person-outline" size={14} color="#888" />
                <Text style={styles.userText}>
                  {fb.user?.name || "Unknown"} · {fb.user?.email || "No email"}
                </Text>
              </View>

              {/* Rating */}
              {fb.rating ? (
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= fb.rating ? "star" : "star-outline"}
                      size={16}
                      color={star <= fb.rating ? "#F2B138" : "#ccc"}
                    />
                  ))}
                </View>
              ) : null}

              {/* Message */}
              <Text style={styles.messageText}>{fb.message}</Text>

              {/* Admin reply */}
              {fb.adminReply ? (
                <View style={styles.replyContainer}>
                  <View style={styles.replyHeader}>
                    <Ionicons name="arrow-undo-outline" size={14} color="#F2B138" />
                    <Text style={styles.replyHeaderText}>Admin Reply</Text>
                  </View>
                  <Text style={styles.replyText}>{fb.adminReply}</Text>
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.actionRow}>
                {fb.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#E8F5E9" }]}
                      onPress={() => handleChangeStatus(fb, "resolved")}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#66BB6A" />
                      <Text style={[styles.actionBtnText, { color: "#66BB6A" }]}>Resolve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#E3F2FD" }]}
                      onPress={() => handleOpenReply(fb)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#42A5F5" />
                      <Text style={[styles.actionBtnText, { color: "#42A5F5" }]}>Reply</Text>
                    </TouchableOpacity>
                  </>
                )}
                {fb.status === "reviewed" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#E8F5E9" }]}
                      onPress={() => handleChangeStatus(fb, "resolved")}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#66BB6A" />
                      <Text style={[styles.actionBtnText, { color: "#66BB6A" }]}>Resolve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#FFF3E0" }]}
                      onPress={() => handleChangeStatus(fb, "pending")}
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color="#FFA726" />
                      <Text style={[styles.actionBtnText, { color: "#FFA726" }]}>Reopen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#E3F2FD" }]}
                      onPress={() => handleOpenReply(fb)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#42A5F5" />
                      <Text style={[styles.actionBtnText, { color: "#42A5F5" }]}>Reply</Text>
                    </TouchableOpacity>
                  </>
                )}
                {fb.status === "resolved" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#FFF3E0" }]}
                      onPress={() => handleChangeStatus(fb, "pending")}
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color="#FFA726" />
                      <Text style={[styles.actionBtnText, { color: "#FFA726" }]}>Reopen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#E3F2FD" }]}
                      onPress={() => handleOpenReply(fb)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#42A5F5" />
                      <Text style={[styles.actionBtnText, { color: "#42A5F5" }]}>Reply</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        {/* Load more */}
        {page < totalPages && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? (
              <ActivityIndicator size="small" color="#F2B138" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Reply Modal */}
      <Modal
        visible={replyModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setReplyModal({ visible: false, feedback: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reply to Feedback</Text>
            {replyModal.feedback && (
              <View style={styles.modalFeedbackPreview}>
                <Text style={styles.modalPreviewSubject}>{replyModal.feedback.subject}</Text>
                <Text style={styles.modalPreviewMessage} numberOfLines={3}>
                  {replyModal.feedback.message}
                </Text>
              </View>
            )}
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply..."
              placeholderTextColor="#999"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReplyModal({ visible: false, feedback: null })}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!replyText.trim() || replying) && styles.submitBtnDisabled]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || replying}
              >
                {replying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Send Reply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#282F2E",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#282F2E",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  // Filters
  filterRow: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#F2B138",
    borderColor: "#F2B138",
  },
  filterChipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: "#999",
    fontSize: 16,
  },
  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    flexShrink: 0,
    marginLeft: 8,
  },
  cardSubject: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282F2E",
    marginBottom: 6,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  userText: {
    fontSize: 13,
    color: "#888",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  // Reply
  replyContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  replyHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F2B138",
  },
  replyText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  loadMoreText: {
    color: "#F2B138",
    fontSize: 15,
    fontWeight: "700",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#282F2E",
    marginBottom: 12,
  },
  modalFeedbackPreview: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalPreviewSubject: {
    fontSize: 14,
    fontWeight: "700",
    color: "#282F2E",
    marginBottom: 4,
  },
  modalPreviewMessage: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#282F2E",
    minHeight: 120,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F2B138",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
