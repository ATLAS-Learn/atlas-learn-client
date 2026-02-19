import React, { useEffect, useState } from "react";
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
import { DashboardData, Chapter, Progress, QuizAttempt } from "@/lib/types";
import WelcomeHeader from "@/components/progress/welcome-header";
import ProgressBar from "@/components/progress/progress-bar";
import CurrentChapterCard from "@/components/progress/current-chapter-card";
import NextChapterCard from "@/components/progress/next-chapter-card";
import { useUserStore } from "@/lib/store/user";

export default function LearnDashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "User data not available. Please sign in again.");
        router.replace("/(auth)");
        return;
      }

      const [allChapters, quizzes, attempts] = await Promise.all([
        apiClient.getChapters(),
        apiClient.getQuizzes(1000),
        apiClient.getUserQuizAttempts(user.id),
      ]);

      if (allChapters.length === 0) {
        Alert.alert("Info", "No chapters available yet.");
        return;
      }

      allChapters.sort((a, b) => a.order - b.order);
      const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
      const passedAttemptQuizIds = new Set(
        attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.quizId)
      );
      const completedChapterIds = new Set<string>();
      passedAttemptQuizIds.forEach((quizId) => {
        const quiz = quizzesById.get(quizId);
        if (quiz?.chapterId) {
          completedChapterIds.add(quiz.chapterId);
        }
      });

      const currentChapter =
        allChapters.find((chapter) => !completedChapterIds.has(chapter.id)) || allChapters[0];

      let nextChapter: Chapter | undefined;

      const currentIndex = allChapters.findIndex((c) => c.id === currentChapter.id);
      if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
        nextChapter = allChapters[currentIndex + 1];
      }

      const overallProgress =
        quizzes.length > 0 ? Math.round((passedAttemptQuizIds.size / quizzes.length) * 100) : 0;
      const streak = calculateStreakFromAttempts(attempts);
      const latestActivity = getLatestActivity(attempts) || user.createdAt;

      const finalProgress: Progress = {
        userId: user.id,
        currentChapterId: currentChapter.id,
        completedChapters: Array.from(completedChapterIds),
        completedLessons: [],
        completedQuizzes: Array.from(passedAttemptQuizIds),
        overallProgress,
        streak,
        lastActiveDate: latestActivity,
      };

      const isNextChapterLocked = !completedChapterIds.has(currentChapter.id);

      const localDashboardData: DashboardData = {
        user,
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
  };

  const handleRefresh = () => {
    setRefreshing(true);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <WelcomeHeader
        name={dashboardData.user.name.split(" ")[0]}
        streak={dashboardData.progress.streak}
      />

      <ProgressBar progress={dashboardData.progress.overallProgress} />

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
        onPress={() => router.push("/(tabs)/learn/chapters")}
      >
        <Ionicons name="list" size={24} color="#F2B138" />
        <Text style={styles.chaptersButtonText}>View All Chapters</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function getLatestActivity(attempts: QuizAttempt[]): string | null {
  if (attempts.length === 0) return null;
  return attempts
    .map((attempt) => attempt.completedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function calculateStreakFromAttempts(attempts: QuizAttempt[]): number {
  if (attempts.length === 0) return 0;

  const activeDays = new Set(
    attempts.map((attempt) => new Date(attempt.completedAt).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
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
