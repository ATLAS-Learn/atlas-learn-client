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
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      if (fontError) {
        console.warn("Font loading error:", fontError);
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <>{children}</>;
}
