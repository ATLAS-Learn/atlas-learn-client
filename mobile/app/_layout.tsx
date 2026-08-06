import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "@/components/ui/font-loader";
import { SplashScreen } from "@/components/ui/splash-screen";
import { useAppFlow } from "../hooks/useAppFlow";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { preloadCache } from "@/lib/utils/cache";
import useBackgroundSync from "@/hooks/useBackgroundSync";

export default function RootLayout() {
  const router = useRouter();
  const { assessmentComplete, isAuthenticated, isLoading } = useAppFlow();
  const hasNavigated = useRef(false);

  useBackgroundSync();

  useEffect(() => {
    preloadCache(["cache:chapters", "cache:progress:overall"]).catch(() => {});
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
        <AuthProvider>
          <FontLoader>
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
          </FontLoader>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
