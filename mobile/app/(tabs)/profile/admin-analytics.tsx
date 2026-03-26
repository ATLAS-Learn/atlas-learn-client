import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { AdminAnalyticsOverview, UserRole } from "@/lib/types";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const LABELS: Record<string, string> = {
  totalUsers: "Total Users",
  activeUsers: "Active Users",
  deactivatedUsers: "Deactivated Users",
  totalStudents: "Students",
  totalTeachers: "Teachers",
  totalAdmins: "Admins",
  pendingRoleUpgrades: "Pending Upgrades",
  totalSubjects: "Subjects",
  totalChapters: "Chapters",
  totalLessons: "Lessons",
  totalQuizzes: "Quizzes",
  totalAssessments: "Assessments",
};

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { canAccess, roleKnown } = useRoleGuard([UserRole.ADMIN], {
    denyMessage: "This page is only available to admins.",
  });
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const data = await apiClient.getAdminAnalyticsOverview();
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const cards = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview)
      .filter(([, value]) => typeof value === "number")
      .map(([key, value]) => ({
        key,
        label: LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        value: value as number,
      }));
  }, [overview]);

  if (!roleKnown || !canAccess) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Analytics</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadOverview();
        }} />}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No analytics available</Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.key} style={styles.card}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
            </View>
          ))
        )}
      </ScrollView>
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
  scrollView: { flex: 1 },
  content: { padding: 16 },
  emptyContainer: { marginTop: 80, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#666", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 18,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
  cardValue: { marginTop: 8, fontSize: 28, color: "#282F2E", fontWeight: "800" },
});
