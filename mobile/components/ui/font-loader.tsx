import * as Font from "expo-font";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { fonts } from "@/lib/constants/fonts";

export function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync(fonts);
        setFontsLoaded(true);
      } catch (error) {
        console.error("Error loading fonts:", error);
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  return <>{children}</>;
}
