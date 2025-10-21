import { useRouter } from "expo-router";
import React from "react";
import { Image, View } from "react-native";

export const RouteBack = () => {
  const router = useRouter();
  return (
    <View className="w-full flex flex-row items-center justify-start mt-4">
      <Image
        source={require("@/assets/images/icons/arrow-left.png")}
        resizeMode="contain"
        onProgress={() => router.back()}
      />
    </View>
  );
};
