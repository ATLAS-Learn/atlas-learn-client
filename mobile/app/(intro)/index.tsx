import { MiddleSection } from "@/components/intro/middle-section";
import { TopBanner } from "@/components/intro/top-banner";
import { INTRO_STEPS } from "@/constants";
import { setItem } from "@/utils/storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Text,
  TouchableHighlight,
  View,
} from "react-native";

export default function IntroScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Spinner animation using React Native's Animated API
  useEffect(() => {
    if (isLoading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [isLoading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const completeOnboarding = async () => {
    setIsLoading(true);

    try {
      await setItem("onboardingComplete", "true");

      // Small delay to ensure storage is complete
      setTimeout(() => {
        setIsLoading(false);
        router.replace("/(auth)/signin");
      }, 500);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsLoading(false);
    }
  };

  const changeStep = () => {
    setCurrentStep((prev) => (prev < INTRO_STEPS ? prev + 1 : INTRO_STEPS));
  };

  return (
    <View className="flex-1 justify-center items-center h-full w-full flex flex-col relative">
      {/* Top banner */}
      <View className="w-full p-[25px] mb-[20rem]">
        <TopBanner step={currentStep} />
      </View>

      <View className="w-full flex flex-col gap-8 bg-white rounded-xl p-[25px] py-[2.5rem] rounded-b-none absolute bottom-0 left-0 right-0 h-[358px]">
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
          disabled={isLoading}
          onPress={() => {
            changeStep();
            if (currentStep === INTRO_STEPS) {
              completeOnboarding();
            }
          }}
        >
          {isLoading ? (
            <Animated.Image
              source={require("@/assets/images/icons/spnner.png")}
              style={{
                width: 24,
                height: 24,
                transform: [{ rotate: spin }],
              }}
              resizeMode="contain"
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
