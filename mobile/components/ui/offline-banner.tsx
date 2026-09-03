import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkState } from "@/hooks/useNetworkState";

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkState();
  const insets = useSafeAreaInsets();
  const isOffline = isConnected === false || isInternetReachable === false;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: isOffline ? 36 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: isOffline ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (!isOffline) setMounted(false);
    });
    if (isOffline) setMounted(true);
  }, [isOffline, heightAnim, opacityAnim]);

  if (!isOffline && !mounted) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          paddingTop: insets.top,
          height: heightAnim.interpolate({
            inputRange: [0, 36],
            outputRange: [0, 36 + insets.top],
          }),
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
      <Text style={styles.text}>{"You're offline \u2014 changes will sync when reconnected"}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FEF3C7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 6,
    overflow: "hidden",
  },
  text: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "500",
  },
});
