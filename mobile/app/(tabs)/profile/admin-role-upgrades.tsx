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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { PendingRoleUpgradeRequest } from "@/lib/types";

export default function AdminRoleUpgradesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<PendingRoleUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await apiClient.getPendingRoleUpgrades();
      setRequests(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load pending requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprove = (request: PendingRoleUpgradeRequest) => {
    const userId = request.user?.id;
    if (!userId) {
      Alert.alert("Error", "User id missing for this request.");
      return;
    }

    Alert.alert("Approve Request", `Approve ${request.user?.name || "this user"} as teacher?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          setProcessingUserId(userId);
          try {
            const response = await apiClient.approveRoleUpgrade(userId);
            Alert.alert("Success", response.message || "Role upgraded successfully.");
            setRequests((prev) => prev.filter((item) => item.requestId !== request.requestId));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to approve request.");
          } finally {
            setProcessingUserId(null);
          }
        },
      },
    ]);
  };

  const handleReject = (request: PendingRoleUpgradeRequest) => {
    const userId = request.user?.id;
    if (!userId) {
      Alert.alert("Error", "User id missing for this request.");
      return;
    }

    Alert.alert("Reject Request", `Reject ${request.user?.name || "this user"}'s upgrade request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setProcessingUserId(userId);
          try {
            const response = await apiClient.rejectRoleUpgrade(userId);
            Alert.alert("Success", response.message || "Role upgrade rejected.");
            setRequests((prev) => prev.filter((item) => item.requestId !== request.requestId));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to reject request.");
          } finally {
            setProcessingUserId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading pending requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Role Upgrade Requests</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          requests.map((request) => {
            const userId = request.user?.id || "";
            const busy = processingUserId === userId;

            return (
              <View key={request.requestId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.nameText}>{request.user?.name || "Unknown User"}</Text>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
                <Text style={styles.emailText}>{request.user?.email || "No email"}</Text>

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>School:</Text>
                  <Text style={styles.fieldValue}>{request.details?.school || "Not provided"}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Reason:</Text>
                  <Text style={styles.fieldValue}>{request.details?.reason || "Not provided"}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleReject(request)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#E57373" />
                    ) : (
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(request)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.approveButtonText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  },
  emptyContainer: {
    marginTop: 64,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#999",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282F2E",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F2B138",
  },
  emailText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 10,
  },
  fieldRow: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
  },
  fieldValue: {
    fontSize: 14,
    color: "#282F2E",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 96,
    alignItems: "center",
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: "#FFEBEE",
    backgroundColor: "#fff",
  },
  rejectButtonText: {
    color: "#E57373",
    fontWeight: "700",
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  approveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
