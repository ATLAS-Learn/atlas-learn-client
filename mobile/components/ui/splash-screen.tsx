import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export const SPLASH_SEQUENCE_MS = 1800;

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/intro.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.text}>Your Gateway to an A Grade</Text>
      </View>

      <Image
        source={require("@/assets/images/waves.png")}
        resizeMode="stretch"
        style={styles.waves}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3B43C",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: height * 0.08,
  },
  logo: {
    width: Math.min(width * 0.58, 280),
    height: Math.min(width * 0.58, 280),
    marginBottom: 18,
  },
  text: {
    fontSize: Math.min(width, height) * 0.038,
    fontFamily: "Nunito-Bold",
    color: "#2B2416",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  waves: {
    width: width,
    height: Math.max(140, height * 0.18),
  },
});
