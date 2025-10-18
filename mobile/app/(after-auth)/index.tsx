import React from "react";
import { Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 p-4 gap-4">
        <Text className="font-sans text-2xl">Regular Text</Text>
        <Text className="font-medium text-2xl">Medium Text</Text>
        <Text className="font-semibold text-2xl">Semibold Text</Text>
        <Text className="font-bold text-2xl">Bold Text</Text>
        <Text className="font-extrabold text-2xl">Extra Bold Text</Text>
        <Text className="font-black text-2xl">Black Text</Text>

        {/* Italic variants */}
        <Text className="font-sans-italic text-2xl">Regular Italic Text</Text>
        <Text className="font-medium-italic text-2xl">Medium Italic Text</Text>
        <Text className="font-bold-italic text-2xl">Bold Italic Text</Text>
      </View>
    </View>
  );
}
