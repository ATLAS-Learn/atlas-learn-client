import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "@/components/ui/font-loader";
import { SplashScreen } from "@/components/ui/splash-screen";
import OfflineBanner from "@/components/ui/offline-banner";
import { useAppFlow } from "../hooks/useAppFlow";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { preloadCache } from "@/lib/utils/cache";
import useBackgroundSync from "@/hooks/useBackgroundSync";
import useChapterPrefetch from "@/hooks/useChapterPrefetch";

function SyncProvider({ children }: { children: React.ReactNode }) {
  useBackgroundSync();
  useChapterPrefetch();
  return <>{children}</>;
}

export default function RootLayout() {
  const router = useRouter();
  const { assessmentComplete, isAuthenticated, isLoading } = useAppFlow();
  const hasNavigated = useRef(false);

  useEffect(() => {
    preloadCache([
      "cache:chapters",
      "cache:progress:overall",
      "cache:progress:streak",
      "cache:learning-path",
      "cache:leaderboard",
      "cache:assessment-result",
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;
    hasNavigated.current = true;

    if (!isAuthenticated) {
      router.replace("/(auth)");
    } else if (assessmentComplete) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(onboarding)");
    }
  }, [isLoading, isAuthenticated, assessmentComplete, router]);

  if (isLoading) {
    return (
      <SafeAreaProvider className="bg-[#FAFAFA]">
        <QueryProvider>
          <AuthProvider>
            <FontLoader>
              <SplashScreen />
            </FontLoader>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider className="bg-[#FAFAFA]">
      <QueryProvider>
        <SyncProvider>
          <AuthProvider>
            <FontLoader>
              <View style={{ flex: 1 }}>
                <OfflineBanner />
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(intro)/index" />
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </View>
            </FontLoader>
          </AuthProvider>
        </SyncProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
