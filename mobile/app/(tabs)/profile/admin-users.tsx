import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { AdminUserListItem, UserRole } from "@/lib/types";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function AdminUsersScreen() {
  const router = useRouter();
  const { canAccess, roleKnown } = useRoleGuard([UserRole.ADMIN], {
    denyMessage: "This page is only available to admins.",
  });
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiClient.getAdminUsers();
      setUsers(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.name, user.email, user.username, user.school, user.role]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(needle))
    );
  }, [search, users]);

  const openUserDetails = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const data = await apiClient.getAdminUser(userId);
      setSelectedUser(data);
      setDetailsVisible(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load user details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleActive = (user: AdminUserListItem) => {
    const isActive = user.isActive !== false;
    const actionLabel = isActive ? "Deactivate" : "Reactivate";
    Alert.alert(
      `${actionLabel} User`,
      `${actionLabel} ${user.name || user.email || "this user"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: isActive ? "destructive" : "default",
          onPress: async () => {
            setProcessingUserId(user.id);
            try {
              if (isActive) {
                await apiClient.deactivateAdminUser(user.id);
              } else {
                await apiClient.reactivateAdminUser(user.id);
              }
              await loadUsers();
              if (selectedUser?.id === user.id) {
                const updated = await apiClient.getAdminUser(user.id);
                setSelectedUser(updated);
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || `Failed to ${actionLabel.toLowerCase()} user.`);
            } finally {
              setProcessingUserId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString() + " " + new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!roleKnown || !canAccess) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchCard}>
        <Ionicons name="search-outline" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, role"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadUsers();
        }} />}
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const isActive = user.isActive !== false;
            const busy = processingUserId === user.id;

            return (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.nameText}>{user.name || "Unnamed User"}</Text>
                    <Text style={styles.emailText}>{user.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
                      {isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText}>Role: {user.role}</Text>
                {!!user.school && <Text style={styles.metaText}>School: {user.school}</Text>}

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.smallButton} onPress={() => openUserDetails(user.id)} disabled={loadingDetail}>
                    <Text style={styles.smallButtonText}>Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, !isActive && styles.reactivateButton]}
                    onPress={() => handleToggleActive(user)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={isActive ? "#F44336" : "#2E7D32"} />
                    ) : (
                      <Text style={[styles.smallButtonText, !isActive && styles.reactivateText]}>
                        {isActive ? "Deactivate" : "Reactivate"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>User Details</Text>
            {selectedUser ? (
              <View>
                <Text style={styles.detailLine}>Name: {selectedUser.name || "-"}</Text>
                <Text style={styles.detailLine}>Email: {selectedUser.email}</Text>
                <Text style={styles.detailLine}>Role: {selectedUser.role}</Text>
                <Text style={styles.detailLine}>Username: {selectedUser.username || "-"}</Text>
                <Text style={styles.detailLine}>School: {selectedUser.school || "-"}</Text>
                <Text style={styles.detailLine}>Exam Year: {selectedUser.examYear ? String(selectedUser.examYear) : "-"}</Text>
                <Text style={styles.detailLine}>Status: {selectedUser.isActive === false ? "Inactive" : "Active"}</Text>
                <Text style={styles.detailLine}>Created: {formatDate(selectedUser.createdAt)}</Text>
                <Text style={styles.detailLine}>Last Login: {formatDate(selectedUser.lastLoginAt)}</Text>
                <Text style={styles.detailLine}>Deactivated: {formatDate(selectedUser.deactivatedAt)}</Text>
              </View>
            ) : (
              <Text style={styles.metaText}>No user selected.</Text>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={() => setDetailsVisible(false)}>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#282F2E" },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: { flex: 1, paddingVertical: 14, paddingLeft: 10, color: "#282F2E" },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { marginTop: 80, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#666", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userInfo: { flex: 1, marginRight: 12 },
  nameText: { fontSize: 16, fontWeight: "700", color: "#282F2E" },
  emailText: { marginTop: 4, fontSize: 13, color: "#666" },
  metaText: { marginTop: 6, fontSize: 13, color: "#666" },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  activeBadge: { backgroundColor: "#E8F5E9", borderColor: "#C8E6C9" },
  inactiveBadge: { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" },
  statusText: { fontSize: 12, fontWeight: "700" },
  activeText: { color: "#2E7D32" },
  inactiveText: { color: "#C62828" },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF4D9",
  },
  smallButtonText: { color: "#8A5D00", fontWeight: "700", fontSize: 13 },
  reactivateButton: { backgroundColor: "#E8F5E9" },
  reactivateText: { color: "#2E7D32" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#282F2E", marginBottom: 12 },
  detailLine: { fontSize: 14, color: "#444", marginBottom: 8 },
  submitBtn: {
    marginTop: 16,
    alignSelf: "flex-end",
    backgroundColor: "#F2B138",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitText: { color: "#fff", fontWeight: "700" },
});
