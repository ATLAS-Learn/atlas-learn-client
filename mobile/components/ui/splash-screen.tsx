import React from "react";
import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export const SPLASH_SEQUENCE_MS = 1800;

export function SplashScreen() {
  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <View style={styles.hero}>
=======
      <StatusBar barStyle="dark-content" backgroundColor="#FFD580" translucent={false} />
      <View style={styles.content}>
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
        <Image
          source={require("@/assets/images/logo/Blue atlas logo.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.learnText}>Learn</Text>
        <Text style={styles.tagline}>Your Gateway to an A Grade</Text>
      </View>

      <Image
        source={require("@/assets/images/waves.png")}
<<<<<<< HEAD
        resizeMode="stretch"
=======
        resizeMode="contain"
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
        style={styles.waves}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
    width: "100%",
    height: "100%",
    backgroundColor: "#FFD580",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: width * 0.55,
    height: width * 0.3,
    marginBottom: 1,
  },
  learnText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1B3A5C",
    letterSpacing: 4,
    marginBottom: 32,
  },
  tagline: {
    fontSize: Math.min(width, height) * 0.045,
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
    fontFamily: "Nunito-Bold",
    color: "#2B2416",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  waves: {
<<<<<<< HEAD
    width: width,
    height: Math.max(140, height * 0.18),
=======
    width: "100%",
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
  },
});
