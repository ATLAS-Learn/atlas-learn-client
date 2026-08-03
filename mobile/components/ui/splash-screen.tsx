import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
        resizeMode="contain"
        style={styles.waves}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: "Nunito-Bold",
    color: "#000000",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  waves: {
    width: "100%",
  },
});
