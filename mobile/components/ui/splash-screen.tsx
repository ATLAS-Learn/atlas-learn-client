import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const SPLASH_SEQUENCE_MS = 4300;

export function SplashScreen() {
  const dropTranslateY = useRef(new Animated.Value(-height * 0.2)).current;
  const dropScaleY = useRef(new Animated.Value(1)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.2)).current;
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const mistScale = useRef(new Animated.Value(0.4)).current;
  const mistOpacity = useRef(new Animated.Value(0)).current;
  const waterRise = useRef(new Animated.Value(height * 0.44)).current;
  const waveDriftFront = useRef(new Animated.Value(0)).current;
  const waveDriftBack = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fallSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(dropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dropTranslateY, {
          toValue: height * 0.53,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(520),
          Animated.timing(dropScaleY, {
            toValue: 1.18,
            duration: 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dropScaleY, {
            toValue: 0.7,
            duration: 140,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(dropOpacity, {
          toValue: 0,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(splashOpacity, {
            toValue: 1,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(splashScale, {
          toValue: 1.05,
          duration: 420,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(mistOpacity, {
            toValue: 0.45,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(mistOpacity, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(mistScale, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(80),
      Animated.timing(waterRise, {
        toValue: height * 0.12,
        duration: 2500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const frontWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDriftFront, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveDriftFront, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const backWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDriftBack, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveDriftBack, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    fallSequence.start();
    frontWaveLoop.start();
    backWaveLoop.start();

    return () => {
      fallSequence.stop();
      frontWaveLoop.stop();
      backWaveLoop.stop();
    };
  }, [
    dropOpacity,
    dropScaleY,
    dropTranslateY,
    mistOpacity,
    mistScale,
    splashOpacity,
    splashScale,
    waterRise,
    waveDriftBack,
    waveDriftFront,
  ]);

  const frontWaveTranslateX = useMemo(
    () =>
      waveDriftFront.interpolate({
        inputRange: [0, 1],
        outputRange: [-26, 24],
      }),
    [waveDriftFront]
  );

  const backWaveTranslateX = useMemo(
    () =>
      waveDriftBack.interpolate({
        inputRange: [0, 1],
        outputRange: [22, -28],
      }),
    [waveDriftBack]
  );

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

      <Animated.View
        pointerEvents="none"
        style={[
          styles.drop,
          {
            opacity: dropOpacity,
            transform: [{ translateY: dropTranslateY }, { scaleY: dropScaleY }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.splashRing,
          {
            opacity: splashOpacity,
            transform: [{ scaleX: splashScale }, { scaleY: splashScale }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.splashMist,
          {
            opacity: mistOpacity,
            transform: [{ scale: mistScale }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.waterStage,
          {
            transform: [{ translateY: waterRise }],
          },
        ]}
      >
        <View style={styles.waterBack} />
        <View style={styles.waterFront} />
        <Animated.View
          style={[
            styles.waveBack,
            {
              transform: [{ translateX: backWaveTranslateX }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveFront,
            {
              transform: [{ translateX: frontWaveTranslateX }],
            },
          ]}
        />
        <AnimatedImage
          source={require("@/assets/images/waves.png")}
          resizeMode="stretch"
          style={[
            styles.waveTextureBack,
            {
              transform: [{ translateX: backWaveTranslateX }],
            },
          ]}
        />
        <AnimatedImage
          source={require("@/assets/images/waves.png")}
          resizeMode="stretch"
          style={[
            styles.waveTextureFront,
            {
              transform: [{ translateX: frontWaveTranslateX }],
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
  drop: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 40,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#FFECC0",
    zIndex: 3,
  },
  splashRing: {
    position: "absolute",
    bottom: height * 0.275,
    width: width * 0.2,
    height: 24,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "rgba(255, 245, 224, 0.9)",
    backgroundColor: "transparent",
    zIndex: 3,
  },
  splashMist: {
    position: "absolute",
    bottom: height * 0.26,
    width: width * 0.26,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255, 245, 224, 0.35)",
    zIndex: 3,
  },
  waterStage: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -height * 0.32,
    height: height * 0.74,
  },
  waterBack: {
    position: "absolute",
    left: -width * 0.08,
    right: -width * 0.08,
    top: 96,
    bottom: 0,
    backgroundColor: "#DAA03A",
  },
  waterFront: {
    position: "absolute",
    left: -width * 0.12,
    right: -width * 0.12,
    top: 118,
    bottom: 0,
    backgroundColor: "#F2B138",
  },
  waveBack: {
    position: "absolute",
    top: 48,
    alignSelf: "center",
    width: width * 0.98,
    height: 118,
    borderTopLeftRadius: width * 0.46,
    borderTopRightRadius: width * 0.46,
    backgroundColor: "#D39A36",
    opacity: 0.65,
  },
  waveFront: {
    position: "absolute",
    top: 72,
    alignSelf: "center",
    width: width * 0.84,
    height: 96,
    borderTopLeftRadius: width * 0.4,
    borderTopRightRadius: width * 0.4,
    backgroundColor: "#E9AF45",
    opacity: 0.95,
  },
  waveTextureBack: {
    position: "absolute",
    top: 58,
    left: -width * 0.08,
    width: width * 1.16,
    height: 82,
    opacity: 0.2,
  },
  waveTextureFront: {
    position: "absolute",
    top: 86,
    left: -width * 0.12,
    width: width * 1.22,
    height: 74,
    opacity: 0.32,
  },
});
