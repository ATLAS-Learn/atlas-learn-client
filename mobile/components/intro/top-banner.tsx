import { INTRO_STEPS } from "@/lib/constants";
import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

type Props = {
  step: number;
};

export const ONBOARDING_BANNER_IMAGE = require("@/assets/images/icons/banner.png");
export const ONBOARDING_HAND_WAVE_IMAGE = require("@/assets/images/icons/hand-wave.png");
export const ONBOARDING_CAP_IMAGE = require("@/assets/images/icons/cap.png");
export const ONBOARDING_PIC_IMAGE = require("@/assets/images/icons/pic.png");
export const ONBOARDING_PIC1_IMAGE = require("@/assets/images/icons/pic1.png");
export const ONBOARDING_PIC2_IMAGE = require("@/assets/images/icons/pic2.png");
export const ONBOARDING_STAR_IMAGE = require("@/assets/images/icons/star.png");

export const ONBOARDING_IMAGE_MODULES = [
  ONBOARDING_BANNER_IMAGE,
  ONBOARDING_HAND_WAVE_IMAGE,
  ONBOARDING_CAP_IMAGE,
  ONBOARDING_PIC_IMAGE,
  ONBOARDING_PIC1_IMAGE,
  ONBOARDING_PIC2_IMAGE,
  ONBOARDING_STAR_IMAGE,
];

const BannerImage = () => {
  return (
    <Image
      source={ONBOARDING_BANNER_IMAGE}
      contentFit="fill"
      cachePolicy="memory-disk"
      transition={80}
      style={{ width: "100%", height: 200 }}
      className="rounded-[35px]"
    />
  );
};

export const TopBanner = ({ step }: Props) => {
  switch (step) {
    case 1:
      return (
        <View className="flex w-full">
          <View
            className="w-[103px] h-[116px] bg-white rounded-lg absolute -top-[5rem] z-10 self-center shadow-md flex items-center flex-row justify-center"
            style={{
              transform: [{ skewY: "-6deg" }], // adjust the degree until it matches
            }}
          >
            <Image
              source={ONBOARDING_HAND_WAVE_IMAGE}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={80}
              style={{ width: 56, height: 55 }}
            />
          </View>
          <BannerImage />
        </View>
      );

    case 2:
      return (
        <View className="flex w-full">
          <View
            className="w-auto h-[116px] bg-white rounded-lg absolute -top-[5rem] z-10 self-center shadow-md flex items-center flex-row justify-center gap-0 p-6 py-16"
            style={{
              transform: [{ skewY: "-6deg" }], // adjust the degree until it matches
            }}
          >
            <Image
              source={ONBOARDING_CAP_IMAGE}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={80}
              style={{ width: 73, height: 73 }}
              className="absolute -right-6 -top-10 z-20"
            />
            {[...Array(INTRO_STEPS)].map((_, index) =>
              index + 1 === 1 ? (
                <Image
                  key={index}
                  source={ONBOARDING_PIC_IMAGE}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={80}
                  style={{ width: 52, height: 52 }}
                  className="first:-mr-2 last:-ml-2 first:z-10 last:-z-10 rounded-full"
                />
              ) : index + 1 === 2 ? (
                <Image
                  key={index}
                  source={ONBOARDING_PIC1_IMAGE}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={80}
                  style={{ width: 51, height: 52 }}
                  className="first:-mr-2 last:-ml-2 first:z-10 last:-z-10 rounded-full"
                />
              ) : (
                <Image
                  key={index}
                  source={ONBOARDING_PIC2_IMAGE}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={80}
                  style={{ width: 51, height: 52 }}
                  className="first:-mr-2 last:-ml-2 first:z-10 last:-z-10 rounded-full"
                />
              )
            )}
          </View>
          <BannerImage />
        </View>
      );

    default:
      return (
        <View className="flex w-full">
          <View
            className="w-[103px] h-[116px] bg-white rounded-lg absolute -top-[5rem] z-10 self-center shadow-md flex items-center flex-row justify-center"
            style={{
              transform: [{ skewY: "6deg" }], // adjust the degree until it matches
            }}
          >
            <Image
              source={ONBOARDING_STAR_IMAGE}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={80}
              style={{ width: 56, height: 56 }}
            />
          </View>
          <BannerImage />
        </View>
      );
  }
};
