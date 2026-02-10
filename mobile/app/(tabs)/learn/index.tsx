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
import { DashboardData, Chapter } from "@/lib/types";
import WelcomeHeader from "@/components/progress/welcome-header";
import ProgressBar from "@/components/progress/progress-bar";
import CurrentChapterCard from "@/components/progress/current-chapter-card";
import NextChapterCard from "@/components/progress/next-chapter-card";
import { useUserStore } from "@/lib/store/user";
import { useProgressStore } from "@/lib/store/progress";

export default function LearnDashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { progress, setProgress, calculateOverallProgress } = useProgressStore();
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

      const currentProgress = progress || {
        userId: user.id,
        currentChapterId: "",
        completedChapters: [],
        completedLessons: [],
        completedQuizzes: [],
        overallProgress: 0,
        streak: 1,
        lastActiveDate: new Date().toISOString(),
      };

      let allChapters: Chapter[] = [];
      try {
        allChapters = await apiClient.getChapters();
      } catch (error) {
        console.error("Error loading chapters:", error);
        Alert.alert("Error", "Failed to load chapters. Please try again.");
        return;
      }

      if (allChapters.length === 0) {
        Alert.alert("Info", "No chapters available yet.");
        return;
      }

      allChapters.sort((a, b) => a.order - b.order);

      let currentChapter: Chapter | undefined;
      let nextChapter: Chapter | undefined;

      if (currentProgress.currentChapterId) {
        try {
          currentChapter = await apiClient.getChapter(currentProgress.currentChapterId);
        } catch (error) {
          console.warn(`Chapter ${currentProgress.currentChapterId} not found, resetting to first chapter`);
          currentProgress.currentChapterId = allChapters[0].id;
          setProgress(currentProgress);
          currentChapter = allChapters[0];
        }
      }

      if (!currentChapter) {
        currentChapter = allChapters[0];
        currentProgress.currentChapterId = currentChapter.id;
        setProgress(currentProgress);
      }

      const currentIndex = allChapters.findIndex((c) => c.id === currentChapter.id);
      if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
        nextChapter = allChapters[currentIndex + 1];
      }

      const isNextChapterLocked = currentChapter
        ? !currentProgress.completedChapters.includes(currentChapter.id)
        : true;

      // Calculate overall progress based on lessons + quizzes
      let finalProgress = currentProgress;
      try {
        const quizzes = await apiClient.getQuizzes(1000); // Get all quizzes
        await calculateOverallProgress(allChapters, quizzes);
        // Get updated progress from store after calculation
        const updatedProgress = useProgressStore.getState().progress;
        if (updatedProgress) {
          finalProgress = updatedProgress;
        }
      } catch (error) {
        console.error("Error calculating progress:", error);
      }

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
