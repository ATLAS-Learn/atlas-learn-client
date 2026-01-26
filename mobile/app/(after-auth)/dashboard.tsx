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
import { apiClient } from "@/services/api";
import { DashboardData, Chapter } from "@/services/types";
import WelcomeHeader from "@/components/dashboard/welcome-header";
import ProgressBar from "@/components/dashboard/progress-bar";
import CurrentChapterCard from "@/components/dashboard/current-chapter-card";
import NextChapterCard from "@/components/dashboard/next-chapter-card";
import { useUserStore } from "@/store/user";
import { useProgressStore } from "@/store/progress";
import { CHAPTERS } from "@/data/chapters";

export default function DashboardScreen() {
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
      // Dashboard API not available yet, construct from local stores
      // TODO: When server dashboard API is ready, fetch from: GET /api/dashboard

      if (!user) {
        Alert.alert("Error", "User data not available. Please sign in again.");
        router.replace("/(auth)");
        return;
      }

      // Build dashboard data from local stores and chapters
      const currentProgress = progress || {
        userId: user.id,
        currentChapterId: CHAPTERS[0]?.id || "",
        completedChapters: [],
        overallProgress: 0,
        streak: 1,
        lastActiveDate: new Date().toISOString(),
      };

      const currentChapter = CHAPTERS.find((c) => c.id === currentProgress.currentChapterId) || CHAPTERS[0];
      if (!currentChapter) {
        Alert.alert("Error", "No chapters available.");
        return;
      }

      const currentChapterIndex = CHAPTERS.findIndex((c) => c.id === currentChapter.id);
      const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < CHAPTERS.length - 1
        ? CHAPTERS[currentChapterIndex + 1]
        : undefined;
      const isNextChapterLocked = !currentProgress.completedChapters.includes(currentChapter.id);

      const localDashboardData: DashboardData = {
        user,
        progress: currentProgress,
        currentChapter,
        nextChapter,
        isNextChapterLocked,
      };

      setDashboardData(localDashboardData);
      setProgress(currentProgress);
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard. Please try again.");
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
    router.push(`/(after-auth)/chapters/${chapterId}`);
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

