import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, LogBox, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "@/components/ui/font-loader";
import { SplashScreen } from "@/components/ui/splash-screen";
import { useAppFlow } from "../hooks/useAppFlow";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";

const KEEP_AWAKE_ERROR_PATTERNS = [
  "Unable to activate keep awake",
  "Error: Unable to activate keep awake",
];

const shouldIgnoreKeepAwakeMessage = (value: unknown): boolean => {
  const message =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "message" in value
        ? String((value as { message?: unknown }).message || "")
        : "";

  return KEEP_AWAKE_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

LogBox.ignoreLogs(KEEP_AWAKE_ERROR_PATTERNS);

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const router = useRouter();
  const { assessmentComplete, isAuthenticated, isLoading } = useAppFlow();

  useEffect(() => {
    const globalWithUnhandled = globalThis as typeof globalThis & {
      onunhandledrejection?: ((event: { reason?: unknown; preventDefault?: () => void }) => void) | null;
    };
    const previousHandler = globalWithUnhandled.onunhandledrejection;
    const previousConsoleError = console.error;

    globalWithUnhandled.onunhandledrejection = (event) => {
      if (shouldIgnoreKeepAwakeMessage(event?.reason)) {
        event?.preventDefault?.();
        return;
      }
      previousHandler?.(event);
    };

    console.error = (...args: unknown[]) => {
      if (args.some((arg) => shouldIgnoreKeepAwakeMessage(arg))) {
        return;
      }
      previousConsoleError(...args);
    };

    return () => {
      globalWithUnhandled.onunhandledrejection = previousHandler || null;
      console.error = previousConsoleError;
    };
  }, []);


  useEffect(() => {
    // Wait for auth state to finish loading
    if (isLoading) return;

    // Show splash screen for longer so user can see it (5 seconds minimum)
    const minDisplayTime = 5000; // 5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000, // Slower fade out (1 second)
        useNativeDriver: true,
      }).start(() => {
        setShowIntro(false); // hide splash

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
    }, minDisplayTime); // Show splash for at least 5 seconds

    return () => clearTimeout(timer);
  }, [fadeAnim, isAuthenticated, assessmentComplete, isLoading, router]);


  return (
    <SafeAreaProvider className="bg-[#FAFAFA]">
      <QueryProvider>
        <AuthProvider>
          <FontLoader>
            <StatusBar hidden={true} />
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
