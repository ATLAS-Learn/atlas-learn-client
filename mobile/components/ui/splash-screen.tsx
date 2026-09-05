import React from "react";
import { Image, StatusBar, StyleSheet, Text, View } from "react-native";

const BRAND_TEAL = "#084858";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_TEAL} translucent={false} />
      <Image
        source={require("@/assets/images/icon-gold.png")}
        resizeMode="contain"
        style={styles.icon}
      />
      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkApex}>Apex</Text>
        <Text style={styles.wordmarkLearn}> Learn</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: BRAND_TEAL,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 260,
    height: 260,
    marginBottom: 14,
  },
  wordmark: {
    fontSize: 36,
    textAlign: "center",
    letterSpacing: 1,
  },
  wordmarkApex: {
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
  wordmarkLearn: {
    fontFamily: "Nunito-Black",
    color: "#FFFFFF",
  },
});
