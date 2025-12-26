import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    "Nunito-Regular": require("../assets/fonts/Nunito/static/Nunito-Regular.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito/static/Nunito-Medium.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito/static/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito/static/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito/static/Nunito-ExtraBold.ttf"),
    "Nunito-Black": require("../assets/fonts/Nunito/static/Nunito-Black.ttf"),
    "Nunito-Italic": require("../assets/fonts/Nunito/static/Nunito-Italic.ttf"),
    "Nunito-MediumItalic": require("../assets/fonts/Nunito/static/Nunito-MediumItalic.ttf"),
    "Nunito-SemiBoldItalic": require("../assets/fonts/Nunito/static/Nunito-SemiBoldItalic.ttf"),
    "Nunito-BoldItalic": require("../assets/fonts/Nunito/static/Nunito-BoldItalic.ttf"),
    "Nunito-ExtraBoldItalic": require("../assets/fonts/Nunito/static/Nunito-ExtraBoldItalic.ttf"),
    "Nunito-BlackItalic": require("../assets/fonts/Nunito/static/Nunito-BlackItalic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <>{children}</>;
}
