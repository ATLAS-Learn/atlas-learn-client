import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { DashboardData, Chapter, Progress } from "@/lib/types";
import WelcomeHeader from "@/components/progress/welcome-header";
import ProgressBar from "@/components/progress/progress-bar";
import CurrentChapterCard from "@/components/progress/current-chapter-card";
import NextChapterCard from "@/components/progress/next-chapter-card";
import { useUserStore } from "@/lib/store/user";
import { useOverallProgress } from "@/lib/hooks/api";

export default function LearnDashboardScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { data: overallProgressData, refetch: refetchOverallProgress } = useOverallProgress();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDashboardData((prev) => (prev ? { ...prev, user } : prev));
  }, [user]);

  useEffect(() => {
    if (!overallProgressData) return;
    setDashboardData((prev) => {
      if (!prev) return prev;
      const nextOverall = Number(
        overallProgressData.overall?.completionPercentage ?? prev.progress.overallProgress
      );
      const nextStreak = prev.progress.streak;

      if (nextOverall === prev.progress.overallProgress && nextStreak === prev.progress.streak) {
        return prev;
      }

      return {
        ...prev,
        progress: {
          ...prev.progress,
          overallProgress: nextOverall,
          streak: nextStreak,
        },
      };
    });
  }, [overallProgressData]);

  const loadDashboard = useCallback(async () => {
    try {
      let activeUser = user;
      if (!activeUser) {
        activeUser = await apiClient.getCurrentUser();
        setUser(activeUser);
      }
      if (!activeUser) {
        throw new Error("User data not available");
      }

      const [allChaptersRaw, serverProgress] = await Promise.all([
        apiClient.getChapters(),
        apiClient.getOverallProgress(),
      ]);
      const allChapters = (Array.isArray(allChaptersRaw) ? allChaptersRaw : []).map((chapter) => ({
        ...chapter,
        content: Array.isArray(chapter.content) ? chapter.content : [],
        estimatedTime: typeof chapter.estimatedTime === "number" ? chapter.estimatedTime : 0,
      }));

      if (allChapters.length === 0) {
        Alert.alert("Info", "No chapters available yet.");
        return;
      }

      allChapters.sort((a, b) => a.order - b.order);
      const completedChapterCount = Math.max(
        0,
        Math.min(serverProgress?.overall?.chapters?.completed || 0, allChapters.length)
      );
      const completedChapterIds = new Set<string>(
        allChapters.slice(0, completedChapterCount).map((chapter) => chapter.id)
      );

      const currentChapter =
        allChapters[completedChapterCount] || allChapters[allChapters.length - 1];

      let nextChapter: Chapter | undefined;

      const currentIndex = allChapters.findIndex((c) => c.id === currentChapter.id);
      if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
        nextChapter = allChapters[currentIndex + 1];
      }

      const overallProgress = Number(
        overallProgressData?.overall?.completionPercentage ??
          serverProgress?.overall?.completionPercentage ??
          0
      );
      const streak = 0;
      const latestActivity = activeUser.createdAt;

      const finalProgress: Progress = {
        userId: activeUser.id,
        currentChapterId: currentChapter.id,
        completedChapters: Array.from(completedChapterIds),
        completedLessons: [],
        completedQuizzes: [],
        overallProgress,
        streak,
        lastActiveDate: latestActivity,
      };

      const isNextChapterLocked = completedChapterCount <= currentIndex;

      const localDashboardData: DashboardData = {
        user: activeUser,
        progress: finalProgress,
        currentChapter,
        nextChapter,
        isNextChapterLocked,
      };

      setDashboardData(localDashboardData);
    } catch (error: unknown) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", (error as Error).message || "Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [overallProgressData, setUser, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    refetchOverallProgress();
    loadDashboard();
  };

  const handleChapterPress = (chapterId: string) => {
    router.push(`/(tabs)/learn/${chapterId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2B138" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
      </View>
    );
  }

  const headerName =
    user?.name ||
    user?.email?.split("@")[0] ||
    dashboardData.user?.name ||
    dashboardData.user?.email?.split("@")[0] ||
    "Student";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <WelcomeHeader
        name={headerName.split(" ")[0]}
        streak={dashboardData.progress.streak}
      />

      <ProgressBar progress={dashboardData.progress.overallProgress} />

      {overallProgressData?.overall?.lessons && (
        <View style={styles.lessonSummaryCard}>
          <Text style={styles.sectionTitle}>Lesson Progress</Text>
          <View style={styles.lessonSummaryRow}>
            <View style={styles.lessonSummaryItem}>
              <Text style={styles.lessonSummaryValue}>
                {overallProgressData.overall.lessons.percentage ?? 0}%
              </Text>
              <Text style={styles.lessonSummaryLabel}>Completion</Text>
            </View>
            <View style={styles.lessonSummaryItem}>
              <Text style={styles.lessonSummaryValue}>
                {overallProgressData.overall.lessons.completed ?? 0}/
                {overallProgressData.overall.lessons.total ?? 0}
              </Text>
              <Text style={styles.lessonSummaryLabel}>Lessons Done</Text>
            </View>
            <View style={styles.lessonSummaryItem}>
              <Text style={styles.lessonSummaryValue}>
                {Math.round((overallProgressData.overall.totalTimeSpent || 0) / 60)}m
              </Text>
              <Text style={styles.lessonSummaryLabel}>Time Spent</Text>
            </View>
          </View>
        </View>
      )}

      <CurrentChapterCard
        chapter={dashboardData.currentChapter}
        onPress={() => handleChapterPress(dashboardData.currentChapter.id)}
      />

      {dashboardData.nextChapter && (
        <NextChapterCard
          chapter={dashboardData.nextChapter}
          isLocked={dashboardData.isNextChapterLocked}
        />
      )}

      <TouchableOpacity
        style={styles.chaptersButton}
        onPress={() => router.push("/(tabs)/learn/subjects")}
      >
        <Ionicons name="albums" size={24} color="#F2B138" />
        <Text style={styles.chaptersButtonText}>Browse Subjects</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#282F2E",
  },
  lessonSummaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  lessonSummaryItem: {
    alignItems: "center",
    flex: 1,
  },
  lessonSummaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#282F2E",
  },
  lessonSummaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  chaptersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 12,
  },
  chaptersButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#282F2E",
  },
});
