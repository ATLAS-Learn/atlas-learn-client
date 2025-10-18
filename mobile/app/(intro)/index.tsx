import React from "react";
import { Button, Text, View } from "react-native";
import { setItem } from "../../utils/storage";

export default function Intro() {
  const completeOnboarding = async () => {
    await setItem("onboardingComplete", "true");
    // You may want to trigger a navigation refresh here
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text className="text-blue-500">
        Welcome to Atlas Learn! This is the intro screen.
      </Text>
      <Button title="Get Started" onPress={completeOnboarding} />
    </View>
  );
}
