import React from "react";
import { Image, StatusBar, StyleSheet, View } from "react-native";

const ICON_SIZE = 240;
const BG = "#FFFFFF";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} translucent={false} />
      <Image
        source={require("@/assets/images/splash-badge.png")}
        resizeMode="contain"
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
