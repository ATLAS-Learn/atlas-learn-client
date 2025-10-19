import { INTRO_STEPS } from "@/constants";
import React from "react";
import { Image, View } from "react-native";

type Props = {
  step: number;
};

const BannerImage = () => {
  return (
    <Image
      source={require("@/assets/images/icons/banner.png")}
      resizeMode="stretch"
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
              source={require("@/assets/images/icons/hand-wave.png")}
              resizeMode="contain"
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
              source={require("@/assets/images/icons/cap.png")}
              resizeMode="contain"
              className="absolute -right-6 -top-10 z-20"
            />
            {[...Array(INTRO_STEPS)].map((_, index) =>
              index + 1 === 1 ? (
                <Image
                  key={index}
                  source={require("@/assets/images/icons/pic.png")}
                  resizeMode="contain"
                  className="first:-mr-2 last:-ml-2 first:z-10 last:-z-10 rounded-full"
                />
              ) : index + 1 === 2 ? (
                <Image
                  key={index}
                  source={require("@/assets/images/icons/pic1.png")}
                  resizeMode="contain"
                  className="first:-mr-2 last:-ml-2 first:z-10 last:-z-10 rounded-full"
                />
              ) : (
                <Image
                  key={index}
                  source={require("@/assets/images/icons/pic2.png")}
                  resizeMode="contain"
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
              source={require("@/assets/images/icons/star.png")}
              resizeMode="contain"
            />
          </View>
          <BannerImage />
        </View>
      );
  }
};
