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
import { AdminAnalyticsChapterCompletion, AdminAnalyticsOverview, AdminAnalyticsQuizStats, AdminAnalyticsWAU, UserRole } from "@/lib/types";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const SECTION_LABELS: Record<string, string> = {
  users: "Users",
  activeUsers: "Active Users",
  content: "Content",
  quizzes: "Quizzes",
};

const METRIC_LABELS: Record<string, string> = {
  total: "Total",
  students: "Students",
  teachers: "Teachers",
  admins: "Admins",
  deactivated: "Deactivated",
  weekly: "Weekly",
  monthly: "Monthly",
  totalTaken: "Total Taken",
  totalAttempts: "Total Attempts",
};

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { canAccess, roleKnown } = useRoleGuard([UserRole.ADMIN], {
    denyMessage: "This page is only available to admins.",
  });
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [chapterCompletion, setChapterCompletion] = useState<AdminAnalyticsChapterCompletion | null>(null);
  const [quizStats, setQuizStats] = useState<AdminAnalyticsQuizStats | null>(null);
  const [wau, setWAU] = useState<AdminAnalyticsWAU | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const [overviewData, chapterCompletionData, quizStatsData, wauData] = await Promise.all([
        apiClient.getAdminAnalyticsOverview(),
        apiClient.getAdminAnalyticsChapterCompletion(),
        apiClient.getAdminAnalyticsQuizStats(),
        apiClient.getAdminAnalyticsWAU(),
      ]);
      setOverview(overviewData);
      setChapterCompletion(chapterCompletionData);
      setQuizStats(quizStatsData);
      setWAU(wauData);
    } catch {
      setOverview(null);
      setChapterCompletion(null);
      setQuizStats(null);
      setWAU(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const sections = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview)
      .filter(([, value]) => value && typeof value === "object" && !Array.isArray(value))
      .map(([sectionKey, sectionValue]) => ({
        key: sectionKey,
        title: SECTION_LABELS[sectionKey] || sectionKey.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        metrics: Object.entries(sectionValue as Record<string, unknown>)
          .filter(([, value]) => typeof value === "number")
          .map(([metricKey, value]) => ({
            key: `${sectionKey}-${metricKey}`,
            label:
              METRIC_LABELS[metricKey] ||
              metricKey.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
            value: value as number,
          })),
      }))
      .filter((section) => section.metrics.length > 0);
  }, [overview]);

  const hasOverview = sections.length > 0;

  const chapterPrimaryMetric = chapterCompletion?.primaryMetric;
  const quizSummary = quizStats?.summary;
  const wauChange = wau?.wauChangePercent;

  const updatedAtText = useMemo(() => {
    if (!overview || typeof overview.updatedAt !== "string") return null;
    return `Updated ${new Date(overview.updatedAt).toLocaleString()}`;
  }, [overview]);

  const topSummary = useMemo(() => {
    if (!overview?.users && !overview?.activeUsers) return [];
    return [
      {
        key: "total-users",
        label: "Total Users",
        value: overview.users?.total ?? 0,
      },
      {
        key: "weekly-active",
        label: "Weekly Active",
        value: overview.activeUsers?.weekly ?? 0,
      },
      {
        key: "monthly-active",
        label: "Monthly Active",
        value: overview.activeUsers?.monthly ?? 0,
      },
    ];
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
        {updatedAtText ? <Text style={styles.updatedAtText}>{updatedAtText}</Text> : null}

        {topSummary.length > 0 ? (
          <View style={styles.summaryGrid}>
            {topSummary.map((card) => (
              <View key={card.key} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{card.label}</Text>
                <Text style={styles.summaryValue}>{card.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {wau ? (
          <View style={styles.trendCard}>
            <Text style={styles.trendEyebrow}>WAU Trend</Text>
            <Text style={styles.trendTitle}>Weekly Active Users</Text>
            <View style={styles.metricGrid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Current WAU</Text>
                <Text style={styles.cardValue}>{wau.currentWAU ?? 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Previous WAU</Text>
                <Text style={styles.cardValue}>{wau.previousWAU ?? 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Change</Text>
                <Text
                  style={[
                    styles.cardValue,
                    typeof wauChange === "number" && wauChange < 0 ? styles.negativeTrendValue : styles.positiveTrendValue,
                  ]}
                >
                  {typeof wauChange === "number" ? `${wauChange}%` : "0%"}
                </Text>
              </View>
            </View>
            <Text style={styles.trendHint}>Baseline metric for the 40% WAU target.</Text>
          </View>
        ) : null}

        {chapterPrimaryMetric ? (
          <View style={styles.primaryMetricCard}>
            <Text style={styles.primaryMetricEyebrow}>Primary Success Metric</Text>
            <Text style={styles.primaryMetricTitle}>
              {chapterPrimaryMetric.label || "Chapter 1 engagement"}
            </Text>
            <View style={styles.metricGrid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Chapter 1 Completion</Text>
                <Text style={styles.cardValue}>{chapterPrimaryMetric.chapter1CompletionRate ?? 0}%</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Chapter 1 Quiz Pass</Text>
                <Text style={styles.cardValue}>{chapterPrimaryMetric.chapter1QuizPassRate ?? 0}%</Text>
              </View>
            </View>
          </View>
        ) : null}

        {quizSummary ? (
          <View style={styles.secondaryMetricCard}>
            <Text style={styles.secondaryMetricEyebrow}>Secondary Metric</Text>
            <Text style={styles.secondaryMetricTitle}>Quiz Pass and Fail Statistics</Text>
            <View style={styles.metricGrid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Quizzes</Text>
                <Text style={styles.cardValue}>{quizSummary.totalQuizzes ?? 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total Attempts</Text>
                <Text style={styles.cardValue}>{quizSummary.totalAttempts ?? 0}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Overall Pass Rate</Text>
                <Text style={styles.cardValue}>{quizSummary.overallPassRate ?? 0}%</Text>
              </View>
            </View>
          </View>
        ) : null}

        {!hasOverview && !wau && !chapterPrimaryMetric && !quizSummary ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={56} color="#999" />
            <Text style={styles.emptyText}>No analytics available</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.metricGrid}>
                {section.metrics.map((metric) => (
                  <View key={metric.key} style={styles.card}>
                    <Text style={styles.cardLabel}>{metric.label}</Text>
                    <Text style={styles.cardValue}>{metric.value}</Text>
                  </View>
                ))}
              </View>
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
  updatedAtText: { marginBottom: 12, color: "#666", fontSize: 13 },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: "#FFF7E3",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3D27A",
    padding: 16,
  },
  summaryLabel: { fontSize: 13, color: "#7A5B12", fontWeight: "700" },
  summaryValue: { marginTop: 8, fontSize: 26, color: "#282F2E", fontWeight: "800" },
  trendCard: {
    backgroundColor: "#FFF4EF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3C9B6",
    padding: 18,
    marginBottom: 16,
  },
  trendEyebrow: { fontSize: 12, color: "#9A4F2B", fontWeight: "800", textTransform: "uppercase" },
  trendTitle: { marginTop: 6, marginBottom: 14, fontSize: 18, color: "#3A2419", fontWeight: "800" },
  trendHint: { marginTop: 12, fontSize: 13, color: "#7A5A49" },
  primaryMetricCard: {
    backgroundColor: "#EEF6FF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#B7D4F7",
    padding: 18,
    marginBottom: 16,
  },
  primaryMetricEyebrow: { fontSize: 12, color: "#315A88", fontWeight: "800", textTransform: "uppercase" },
  primaryMetricTitle: { marginTop: 6, marginBottom: 14, fontSize: 18, color: "#1E2E3E", fontWeight: "800" },
  secondaryMetricCard: {
    backgroundColor: "#F2F8EE",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#C9DDBA",
    padding: 18,
    marginBottom: 16,
  },
  secondaryMetricEyebrow: { fontSize: 12, color: "#4D6B33", fontWeight: "800", textTransform: "uppercase" },
  secondaryMetricTitle: { marginTop: 6, marginBottom: 14, fontSize: 18, color: "#23311A", fontWeight: "800" },
  emptyContainer: { marginTop: 80, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#666", fontSize: 16 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, color: "#282F2E", fontWeight: "800", marginBottom: 12 },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  positiveTrendValue: { color: "#2E7D32" },
  negativeTrendValue: { color: "#C62828" },
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 16,
  },
  cardLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
  cardValue: { marginTop: 8, fontSize: 28, color: "#282F2E", fontWeight: "800" },
});
