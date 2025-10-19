import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "../components/font-loader";
import { SplashScreen } from "../components/splash-screen";
import { useAppFlow } from "../hooks/useAppFlow";

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const router = useRouter();
  const { onboardingComplete, isAuthenticated } = useAppFlow();

  useEffect(() => {
    // Show intro screen for 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowIntro(false);
        // // Navigate based on auth status
        // if (onboardingComplete === null || isAuthenticated === null) return;
        // if (!onboardingComplete) {
        //   router.replace("/(intro)");
        // } else if (!isAuthenticated) {
        //   router.replace("/(auth)");
        // } else {
        //   router.replace("/(after-auth)");
        // }
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onboardingComplete, isAuthenticated, router]);

  return (
    <SafeAreaProvider className="bg-[#FAFAFA]">
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
          <Stack.Screen name="(intro)/index" />
          <Stack.Screen name="(auth)/index" />
          <Stack.Screen name="(after-auth)/index" />
          <Stack.Screen name="(onboarding)/index" />
        </Stack>
      </FontLoader>
    </SafeAreaProvider>
  );
}
