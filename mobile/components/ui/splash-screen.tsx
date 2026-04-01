import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function SplashScreen() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const waveDriftPrimary = useRef(new Animated.Value(0)).current;
  const waveDriftSecondary = useRef(new Animated.Value(0)).current;
  const waveRise = useRef(new Animated.Value(height * 0.28)).current;
  const glowPulse = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const primaryWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDriftPrimary, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveDriftPrimary, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const secondaryWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDriftSecondary, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveDriftSecondary, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.92,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const riseAnimation = Animated.sequence([
      Animated.delay(350),
      Animated.timing(waveRise, {
        toValue: height * 0.06,
        duration: 3800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    floatLoop.start();
    primaryWaveLoop.start();
    secondaryWaveLoop.start();
    glowLoop.start();
    riseAnimation.start();

    return () => {
      floatLoop.stop();
      primaryWaveLoop.stop();
      secondaryWaveLoop.stop();
      glowLoop.stop();
      riseAnimation.stop();
    };
  }, [floatAnim, glowPulse, waveDriftPrimary, waveDriftSecondary, waveRise]);

  const logoTranslateY = useMemo(
    () =>
      floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -14],
      }),
    [floatAnim]
  );

  const logoScale = useMemo(
    () =>
      floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.03],
      }),
    [floatAnim]
  );

  const wavePrimaryTranslateX = useMemo(
    () =>
      waveDriftPrimary.interpolate({
        inputRange: [0, 1],
        outputRange: [-24, 18],
      }),
    [waveDriftPrimary]
  );

  const waveSecondaryTranslateX = useMemo(
    () =>
      waveDriftSecondary.interpolate({
        inputRange: [0, 1],
        outputRange: [18, -28],
      }),
    [waveDriftSecondary]
  );

  const textTranslateY = useMemo(
    () =>
      floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
      }),
    [floatAnim]
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowOrb,
          {
            transform: [{ scale: glowPulse }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.hero,
          {
            transform: [{ translateY: logoTranslateY }],
          },
        ]}
      >
        <AnimatedImage
          source={require("@/assets/images/intro.png")}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        />
        <Animated.Text
          style={[
            styles.text,
            {
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          Your Gateway to an A Grade
        </Animated.Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.waveStage,
          {
            transform: [{ translateY: waveRise }],
          },
        ]}
      >
        <View style={styles.waterFill} />
        <AnimatedImage
          source={require("@/assets/images/waves.png")}
          resizeMode="stretch"
          style={[
            styles.wavePrimary,
            {
              transform: [{ translateX: wavePrimaryTranslateX }],
            },
          ]}
        />
        <AnimatedImage
          source={require("@/assets/images/waves.png")}
          resizeMode="stretch"
          style={[
            styles.waveSecondary,
            {
              transform: [{ translateX: waveSecondaryTranslateX }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFD580",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  glowOrb: {
    position: "absolute",
    top: height * 0.12,
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: width * 0.36,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  hero: {
    zIndex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: height * 0.1,
  },
  logo: {
    width: Math.min(width * 0.58, 280),
    height: Math.min(width * 0.58, 280),
    marginBottom: 22,
  },
  text: {
    fontSize: Math.min(width, height) * 0.06,
    fontFamily: "Nunito-Bold",
    color: "#1B1B1B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  waveStage: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -height * 0.34,
    height: height * 0.72,
  },
  waterFill: {
    position: "absolute",
    left: -width * 0.15,
    right: -width * 0.15,
    top: 90,
    bottom: 0,
    backgroundColor: "#F2B138",
  },
  wavePrimary: {
    position: "absolute",
    top: 0,
    left: -width * 0.08,
    width: width * 1.18,
    height: 130,
    opacity: 0.95,
  },
  waveSecondary: {
    position: "absolute",
    top: 18,
    left: -width * 0.12,
    width: width * 1.24,
    height: 118,
    opacity: 0.55,
  },
});
