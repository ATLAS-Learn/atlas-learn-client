import "../styles/global.css";

import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontLoader } from "../components/font-loader";
import { SplashScreen } from "../components/splash-screen";
import { useAppFlow } from "../hooks/useAppFlow";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const router = useRouter();
  const { onboardingComplete, isAuthenticated } = useAppFlow();


useEffect(() => {
  // Show splash first for 3 seconds
  const timer = setTimeout(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowIntro(false); // hide splash

      // Navigate based on user state
      if (onboardingComplete === null || isAuthenticated === null) return;

      if (!onboardingComplete) {
        // First-time user → go to onboarding
        router.replace("/(intro)");
      } else if (!isAuthenticated) {
        // Returning user but not logged in → go to auth
        router.replace("/(auth)");
      } else {
        // Logged-in user → go to main app
        router.replace("/(after-auth)");
      }
    });
  }, 3000);

  return () => clearTimeout(timer);
}, [fadeAnim, onboardingComplete, isAuthenticated]);


  return (
    <SafeAreaProvider className="bg-[#FAFAFA]">
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
            <Stack.Screen name="(after-auth)/index" />
            <Stack.Screen name="(onboarding)/index" />
          </Stack>
        </FontLoader>
      </AuthProvider>

    </SafeAreaProvider>
  );
}

