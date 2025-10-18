import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          alignItems: "center",
          width: "100%",
          height: "auto",
          flexDirection: "column",
        }}
      >
        <Image
          source={require("@/assets/images/intro.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.text}>Your Gateway to an A Grade</Text>
      </View>
      <Image
        source={require("@/assets/images/waves.png")}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: "#FFD580",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 30,
  },
  logo: {
    marginBottom: 40,
  },
  text: {
    fontSize: Math.min(width, height) * 0.06,
    fontFamily: "Nunito-Bold",
    color: "#000000",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
