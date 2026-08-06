import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "@/components/ui/font-loader";
import { SplashScreen } from "@/components/ui/splash-screen";
import { useAppFlow } from "../hooks/useAppFlow";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { preloadCache } from "@/lib/utils/cache";
import useBackgroundSync from "@/hooks/useBackgroundSync";

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const router = useRouter();
  const { assessmentComplete, isAuthenticated, isLoading } = useAppFlow();
  const hasNavigated = useRef(false);

  // Start background sync worker (process pending quiz submissions)
  // imported hook ensures queue is processed when app becomes active
  // and periodically while active
  useBackgroundSync();

  // Preload important caches so cached content can render immediately
  useEffect(() => {
    // keys we want preloaded synchronously for fast startup
    preloadCache([
      "cache:chapters",
      "cache:progress:overall",
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    // Wait for auth state to finish loading
    if (isLoading) return;

    // Keep splash visible just long enough for UI to not flicker
    const minDisplayTime = 800; // 800ms minimum
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowIntro(false); // hide splash

        // Only navigate on initial splash dismiss
        if (hasNavigated.current) return;
        hasNavigated.current = true;

        // Navigate based on user state
        // Flow: 1. Check auth first, 2. Check assessment completion
        if (!isAuthenticated) {
          // Not authenticated → go to auth (signup/login)
          router.replace("/(auth)");
        } else if (assessmentComplete) {
          // Authenticated and assessment complete → go to main app
          router.replace("/(tabs)");
        } else {
          // Authenticated but assessment not complete → go to onboarding
          router.replace("/(onboarding)");
        }
      });
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [fadeAnim, isAuthenticated, assessmentComplete, isLoading, router]);


  return (
    <SafeAreaProvider className="bg-[#FAFAFA]">
      <QueryProvider>
        <AuthProvider>
          <FontLoader>
            {showIntro && (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                    opacity: fadeAnim,
                  },
                ]}
              >
                <SplashScreen />
              </Animated.View>
            )}
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

