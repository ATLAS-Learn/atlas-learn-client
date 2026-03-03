import React, { useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import QuizScoresChart from "@/components/charts/QuizScoresChart";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { useQuizAttempts, useQuizStats } from "@/lib/hooks/api";
import { QuizAttempt, UserRole } from "@/lib/types";

function normalizeAttempts(attempts: QuizAttempt[]): QuizAttempt[] {
  return attempts.map((attempt) => ({
    ...attempt,
    completedAt: attempt.completedAt || new Date(0).toISOString(),
    percentage: Number.isFinite(attempt.percentage) ? attempt.percentage : 0,
    score: Number.isFinite(attempt.score) ? attempt.score : 0,
  }));
}

export default function AdminQuizAnalyticsScreen() {
  const router = useRouter();
  const { canAccess, roleKnown } = useRoleGuard([UserRole.ADMIN, UserRole.TEACHER], {
    denyMessage: "This page is only available to admins and teachers.",
  });
  const params = useLocalSearchParams<{ quizId?: string; quizTitle?: string; chapterTitle?: string }>();

  const quizId = typeof params.quizId === "string" ? params.quizId : "";
  const quizTitle = typeof params.quizTitle === "string" ? params.quizTitle : "Quiz";
  const chapterTitle = typeof params.chapterTitle === "string" ? params.chapterTitle : "";

  const attemptsQuery = useQuizAttempts(quizId);
  const statsQuery = useQuizStats(quizId);

  const attempts = useMemo(
    () => normalizeAttempts(Array.isArray(attemptsQuery.data) ? attemptsQuery.data : []),
    [attemptsQuery.data]
  );

  const averagePercentage = useMemo(() => {
    if (!attempts.length) return 0;
    return attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / attempts.length;
  }, [attempts]);

  const passCount = useMemo(
    () => attempts.filter((attempt) => Boolean(attempt.passed)).length,
    [attempts]
  );
  const passRateFromAttempts = attempts.length ? (passCount / attempts.length) * 100 : 0;

  if (!roleKnown || !canAccess) {
    return null;
  }

  if (!quizId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Missing quiz ID.</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLoading = attemptsQuery.isLoading || statsQuery.isLoading;
  const isRefreshing = attemptsQuery.isRefetching || statsQuery.isRefetching;
  const stats = statsQuery.data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Analytics</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              attemptsQuery.refetch();
              statsQuery.refetch();
            }}
          />
        }
      >
        <View style={styles.card}>
          <Text style={styles.label}>Quiz</Text>
          <Text style={styles.value}>{quizTitle}</Text>
          {!!chapterTitle && (
            <>
              <Text style={styles.label}>Chapter</Text>
              <Text style={styles.value}>{chapterTitle}</Text>
            </>
          )}
          <Text style={styles.meta}>ID: {quizId}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color="#F2B138" />
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Attempts</Text>
                <Text style={styles.metricValue}>{stats?.totalAttempts ?? attempts.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Avg Score</Text>
                <Text style={styles.metricValue}>
                  {Math.round(Number(stats?.averagePercentage ?? averagePercentage))}%
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pass Rate</Text>
                <Text style={styles.metricValue}>
                  {Math.round(
                    Number(
                      stats?.passRate !== undefined ? stats.passRate : passRateFromAttempts
                    )
                  )}
                  %
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Unique Users</Text>
                <Text style={styles.metricValue}>
                  {stats?.totalUsers ?? new Set(attempts.map((item) => item.userId)).size}
                </Text>
              </View>
            </View>

            <QuizScoresChart attempts={attempts} />

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recent Attempts</Text>
              {attempts.length === 0 ? (
                <Text style={styles.meta}>No attempts yet.</Text>
              ) : (
                attempts
                  .slice()
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .slice(0, 20)
                  .map((attempt) => (
                    <View key={attempt.id} style={styles.attemptRow}>
                      <View style={styles.attemptInfo}>
                        <Text style={styles.attemptTitle}>User: {attempt.userId.slice(0, 8)}</Text>
                        <Text style={styles.meta}>{new Date(attempt.completedAt).toLocaleString()}</Text>
                      </View>
                      <View style={styles.attemptRight}>
                        <Text style={styles.attemptScore}>{Math.round(attempt.percentage)}%</Text>
                        <Text style={[styles.status, attempt.passed ? styles.pass : styles.fail]}>
                          {attempt.passed ? "Passed" : "Failed"}
                        </Text>
                      </View>
                    </View>
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  errorText: { fontSize: 15, color: "#D32F2F", marginBottom: 12 },
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
  backButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  scrollView: { flex: 1 },
  content: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#efefef",
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#efefef",
  },
  metricLabel: { fontSize: 12, color: "#777", marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  label: { fontSize: 12, color: "#777" },
  value: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginBottom: 6 },
  meta: { fontSize: 12, color: "#777", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  loadingBlock: { paddingVertical: 28, alignItems: "center" },
  attemptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  attemptInfo: { flex: 1, marginRight: 8 },
  attemptRight: { alignItems: "flex-end" },
  attemptTitle: { fontSize: 13, color: "#1A1A1A", fontWeight: "600" },
  attemptScore: { fontSize: 15, color: "#1A1A1A", fontWeight: "700" },
  status: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  pass: { color: "#2E7D32" },
  fail: { color: "#C62828" },
  actionButton: {
    backgroundColor: "#F2B138",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionButtonText: { color: "#fff", fontWeight: "700" },
});
