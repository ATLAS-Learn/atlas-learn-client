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
import { DashboardData } from "@/services/types";
import WelcomeHeader from "@/components/dashboard/welcome-header";
import ProgressBar from "@/components/dashboard/progress-bar";
import CurrentChapterCard from "@/components/dashboard/current-chapter-card";
import NextChapterCard from "@/components/dashboard/next-chapter-card";
import { useUserStore } from "@/store/user";
import { useProgressStore } from "@/store/progress";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { setProgress } = useProgressStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await apiClient.getDashboard();
      setDashboardData(data);
      setProgress(data.progress);
    } catch (error: any) {
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

