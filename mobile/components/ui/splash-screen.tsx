import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function SplashScreen() {
  const waveDriftPrimary = useRef(new Animated.Value(0)).current;
  const waveDriftSecondary = useRef(new Animated.Value(0)).current;
  const waveRise = useRef(new Animated.Value(height * 0.34)).current;

  useEffect(() => {
    const primaryWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDriftPrimary, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveDriftPrimary, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const secondaryWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDriftSecondary, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveDriftSecondary, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const riseAnimation = Animated.sequence([
      Animated.delay(500),
      Animated.timing(waveRise, {
        toValue: height * 0.12,
        duration: 3400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    primaryWaveLoop.start();
    secondaryWaveLoop.start();
    riseAnimation.start();

    return () => {
      primaryWaveLoop.stop();
      secondaryWaveLoop.stop();
      riseAnimation.stop();
    };
  }, [waveDriftPrimary, waveDriftSecondary, waveRise]);

  const wavePrimaryTranslateX = useMemo(
    () =>
      waveDriftPrimary.interpolate({
        inputRange: [0, 1],
        outputRange: [-34, 30],
      }),
    [waveDriftPrimary]
  );

  const waveSecondaryTranslateX = useMemo(
    () =>
      waveDriftSecondary.interpolate({
        inputRange: [0, 1],
        outputRange: [30, -38],
      }),
    [waveDriftSecondary]
  );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/intro.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.text}>
          Your Gateway to an A Grade
        </Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.waveStage,
          {
            transform: [{ translateY: waveRise }],
          },
        ]}
      >
        <View style={styles.waterFillAccent} />
        <View style={styles.waterFill} />
        <Animated.View
          style={[
            styles.waveCrestBack,
            {
              transform: [{ translateX: waveSecondaryTranslateX }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveCrestFront,
            {
              transform: [{ translateX: wavePrimaryTranslateX }],
            },
          ]}
        />
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
    backgroundColor: "#F3B43C",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    zIndex: 2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: height * 0.22,
  },
  logo: {
    width: Math.min(width * 0.58, 280),
    height: Math.min(width * 0.58, 280),
    marginBottom: 14,
  },
  text: {
    fontSize: Math.min(width, height) * 0.038,
    fontFamily: "Nunito-Bold",
    color: "#2B2416",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  waveStage: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -height * 0.3,
    height: height * 0.72,
  },
  waterFillAccent: {
    position: "absolute",
    left: -width * 0.1,
    right: -width * 0.1,
    top: 88,
    bottom: 0,
    backgroundColor: "#E0A334",
  },
  waterFill: {
    position: "absolute",
    left: -width * 0.15,
    right: -width * 0.15,
    top: 110,
    bottom: 0,
    backgroundColor: "#F2B138",
  },
  waveCrestBack: {
    position: "absolute",
    top: 44,
    alignSelf: "center",
    width: width * 0.95,
    height: 120,
    borderTopLeftRadius: width * 0.46,
    borderTopRightRadius: width * 0.46,
    backgroundColor: "#D6A03C",
    opacity: 0.55,
  },
  waveCrestFront: {
    position: "absolute",
    top: 62,
    alignSelf: "center",
    width: width * 0.82,
    height: 100,
    borderTopLeftRadius: width * 0.38,
    borderTopRightRadius: width * 0.38,
    backgroundColor: "#EAB34A",
    opacity: 0.9,
  },
  wavePrimary: {
    position: "absolute",
    top: 48,
    left: -width * 0.08,
    width: width * 1.18,
    height: 92,
    opacity: 0.6,
  },
  waveSecondary: {
    position: "absolute",
    top: 78,
    left: -width * 0.12,
    width: width * 1.24,
    height: 80,
    opacity: 0.28,
  },
});
