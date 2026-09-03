import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StatusBar, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

// Must match app.json's expo-splash-screen "imageWidth" (200) exactly — this is
// what makes the native OS splash icon and this JS splash icon feel like the
// same, unmoving element instead of two different screens.
const ICON_SIZE = 200;
const BRAND_TEAL = "#084858";

export function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 450,
      delay: 60,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD580" translucent={false} />

      {/* Same asset, same size, same screen position as the native Android splash
          icon (app.json -> expo-splash-screen). It never moves between the OS
          splash and this screen, so the handoff reads as one continuous splash. */}
      <View style={styles.iconWrap} pointerEvents="none">
        <Image
          source={require("@/assets/images/splash-icon-native.png")}
          resizeMode="contain"
          style={styles.icon}
        />
      </View>

      {/* Wordmark + tagline fade in around the icon once JS has booted. */}
      <Animated.View style={[styles.textWrap, { opacity: fade }]} pointerEvents="none">
        <Text style={styles.wordmarkApex}>apex</Text>
        <Text style={styles.wordmarkLearn}>Learn</Text>
        <Text style={styles.tagline}>Your Gateway to an A Grade</Text>
      </Animated.View>

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
  },
  iconWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginLeft: -ICON_SIZE / 2,
    marginTop: -ICON_SIZE / 2,
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  textWrap: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: ICON_SIZE / 2 + 20,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  wordmarkApex: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "Nunito-Bold",
    color: BRAND_TEAL,
  },
  wordmarkLearn: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "Nunito-Black",
    color: BRAND_TEAL,
  },
  tagline: {
    fontSize: Math.min(width, height) * 0.045,
    fontFamily: "Nunito-Bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 16,
  },
  waves: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
