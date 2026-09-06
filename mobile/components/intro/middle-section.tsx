import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  step: number;
};

export const MiddleSection = ({ step }: Props) => {
  switch (step) {
    case 1:
      return (
        <View className='w-full flex flex-col items-center gap-8'>
          <Text className='text-[24px] font-semibold'>Congratulations 🎉</Text>
          <Text className='text-black/60 text-[18px] font-light leading-[28.80px] break-words text-center'>
            Thank you for downloading our app! Enjoy all of Apex Learn features
            directly in your hands!
          </Text>
        </View>
      );
    case 2:
      return (
        <View className='w-full flex flex-col items-center gap-8'>
          <Text className='text-[24px] font-semibold'>
            Trusted by GCE Examiners
          </Text>
          <Text className='text-black/60 text-[18px] font-light leading-[28.80px] break-words text-center'>
            Apex Learn is trusted by Top GCE Examiners to maintain the student
            learning progress.
          </Text>
        </View>
      );

    default:
      return (
        <View className='w-full flex flex-col items-center gap-8'>
          <Text className='text-[24px] font-semibold'>
            Get Ready, be a Superstar!
          </Text>
          <Text className='text-black/60 text-[18px] font-light leading-[28.80px] break-words text-center'>
            Apex Learn will be tailored to your way of studying. Take control of
            your Education
          </Text>
        </View>
      );
  }
};
