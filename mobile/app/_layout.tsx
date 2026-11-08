import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "@/components/ui/font-loader";
import OfflineBanner from "@/components/ui/offline-banner";
import { useAppFlow } from "../hooks/useAppFlow";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { preloadCache } from "@/lib/utils/cache";
import { storage } from "@/lib/utils/storage";
import useBackgroundSync from "@/hooks/useBackgroundSync";
import useChapterPrefetch from "@/hooks/useChapterPrefetch";
import useOfflinePreload from "@/hooks/useOfflinePreload";
import { apiClient } from "@/lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Hold the native splash until the app flow resolves (must run at module
// scope, before expo-router's delayed internal preventAutoHide kicks in).
SplashScreen.preventAutoHideAsync().catch(() => {});

function SyncProvider({ children }: { children: React.ReactNode }) {
  useBackgroundSync();
  useChapterPrefetch();
  useOfflinePreload();
  return <>{children}</>;
}

function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppFlow();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    let cancelled = false;

    const register = async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const permissions = await Notifications.getPermissionsAsync();
      let status = permissions.status;
      if (status !== "granted") {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== "granted" || cancelled) return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (!cancelled) {
        await apiClient.registerPushToken({
          token,
          platform: Platform.OS,
          deviceName: Constants.deviceName || undefined,
        });
      }
    };

    register().catch((error) => console.error("Push notification registration failed:", error));
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; targetId?: string };
      if (data.type === "EXAM_CORRECTED" && data.targetId) {
        router.push(`/(tabs)/exams/result/${data.targetId}` as any);
      } else if (data.type === "EXAM_PUBLISHED" && data.targetId) {
        router.push(`/(tabs)/exams/${data.targetId}` as any);
      } else if (data.type === "QUIZ_CORRECTED") {
        router.push("/(tabs)/profile/notifications" as any);
      } else {
        router.push("/(tabs)/profile/notifications" as any);
      }
    });

    return () => {
      cancelled = true;
      responseSubscription.remove();
    };
  }, [isAuthenticated, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const router = useRouter();
  const { assessmentComplete, isAuthenticated, isLoading } = useAppFlow();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Load ALL cached keys from MMKV into memory — enables full offline access
    storage.getAllKeys().then((keys) => {
      if (keys.length > 0) {
        preloadCache([...keys]).catch(() => {});
      }
    });
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

  // Reveal the app once the flow has resolved and the redirect target has
  // mounted — the native splash covers the screen until hideAsync().
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <SafeAreaProvider className="bg-[#FAFAFA]">
        <QueryProvider>
          <AuthProvider>
            <FontLoader>{null}</FontLoader>
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
            <PushNotificationProvider>
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
            </PushNotificationProvider>
          </AuthProvider>
        </SyncProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
