import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
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
  const { progress, setProgress } = useProgressStore();
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

      const localDashboardData: DashboardData = {
        user,
        progress: currentProgress,
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
});
