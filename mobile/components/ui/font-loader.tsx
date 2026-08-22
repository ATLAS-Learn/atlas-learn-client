import * as Font from "expo-font";
import React, { useEffect, useState } from "react";
import { fonts } from "@/lib/constants/fonts";

export function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync(fonts)
      .then(() => setFontsLoaded(true))
      .catch(() => {
        // Fonts failed — app works fine with system fonts
        setFontsLoaded(true);
      });
  }, []);

  // Render children immediately — custom fonts apply once loaded via expo-font
  // state, causing a subtle text re-render. No gate, no white screen.
  return <>{children}</>;
}
