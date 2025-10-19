import { MiddleSection } from "@/components/intro/middle-section";
import { TopBanner } from "@/components/intro/top-banner";
import { INTRO_STEPS } from "@/constants";
import { setItem } from "@/utils/storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableHighlight, View } from "react-native";

export default function Intro() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const completeOnboarding = async () => {
    await setItem("onboardingComplete", "true");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(auth)");
    }, 500);
  };

  const changeStep = () => {
    setCurrentStep((prev) => (prev < INTRO_STEPS ? prev + 1 : INTRO_STEPS));
  };

  return (
    <View className="flex-1 justify-center items-center h-full w-full p-[25px] flex flex-col gap-28 relative">
      {/* Top banner */}
      <TopBanner step={currentStep} />

      <View className="w-full flex flex-col gap-8">
        <MiddleSection step={currentStep} />

        <View className="w-full flex items-center justify-center gap-2 flex-row">
          {[...Array(INTRO_STEPS)].map((_, index) =>
            currentStep === index + 1 ? (
              <View
                className="bg-[#F2B138] h-2 w-[28px] rounded-full"
                key={index}
              />
            ) : (
              <View
                className="bg-[#CFD5DC] w-[9px] h-[9px] rounded-full"
                key={index}
              />
            )
          )}
        </View>
        <TouchableHighlight
          className="w-full bg-[#F2B138] rounded-[12px] h-[3.8rem] shadow-lg p-[16px] flex flex-row items-center justify-center"
          onPress={() => {
            changeStep();
            if (currentStep === INTRO_STEPS) {
              completeOnboarding();
            }
          }}
        >
          {isLoading ? (
            <Image
              source={require("@/assets/images/icons/spnner.png")}
              resizeMode="contain"
              className="animate-spin"
            />
          ) : (
            <View className="w-full flex flex-row h-full justify-center items-center gap-[8px]">
              <Text className="text-white text-[16px] font-semibold">
                {currentStep === INTRO_STEPS ? "Start your Journey!" : "Next"}
              </Text>
              {currentStep !== INTRO_STEPS && (
                <Image
                  source={require("@/assets/images/icons/arrow-right.png")}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        </TouchableHighlight>
      </View>
    </View>
  );
}
