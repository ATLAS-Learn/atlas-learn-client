import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export const SocialAuths = () => {
  return (
    <View className="w-full flex flex-col items-center mt-6">
      <View className="flex flex-row items-center justify-center gap-6">
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-[64px] h-[64px] rounded-full items-center justify-center flex-row p-[18px] border border-gray-300 bg-white"
          onPress={() => console.log("Continue with Facebook")}
        >
          <Image
            source={require("@/assets/images/icons/facebook.png")}
            resizeMode="contain"
            className="w-[28px] h-[28px]"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-[64px] h-[64px] rounded-full items-center justify-center flex-row p-[18px] border border-gray-300 bg-white"
          onPress={() => console.log("Continue with Google")}
        >
          <Image
            source={require("@/assets/images/icons/google.png")}
            resizeMode="contain"
            className="w-[28px] h-[28px]"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-[64px] h-[64px] rounded-full items-center justify-center flex-row p-[18px] border border-gray-300 bg-white"
          onPress={() => console.log("Continue with Apple")}
        >
          <Image
            source={require("@/assets/images/icons/apple.png")}
            resizeMode="contain"
            className="w-[28px] h-[28px]"
          />
        </TouchableOpacity>
      </View>

      <View className="w-full flex flex-row items-center justify-center gap-4 mt-6">
        <View className="flex-1 h-[1px] bg-gray-200" />
        <Text className="text-center text-[16px] font-light">
          or continue with
        </Text>
        <View className="flex-1 h-[1px] bg-gray-200" />
      </View>
    </View>
  );
};
