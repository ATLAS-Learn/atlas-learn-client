// PhoneNumberInput.tsx
import React, { useState } from "react";
import { Text, View } from "react-native";
import PhoneInput from "react-native-international-phone";
import "react-native-international-phone/style.css";

export default function PhoneNumberInput() {
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <View className="flex-1 justify-center items-center bg-gray-100">
      <View className="w-11/12 max-w-md p-6 bg-white rounded-xl shadow-md">
        <Text className="text-center text-xl font-semibold mb-4">
          Phone Number
        </Text>

        <PhoneInput
          defaultCountry="CM"
          onChangeText={setPhoneNumber}
          value={phoneNumber}
          containerStyle={{ width: "100%" }}
          textStyle={{ fontSize: 16 }}
          flagButtonStyle={{ borderRadius: 12 }}
        />

        <Text className="mt-4 text-center text-gray-500 text-sm">
          Selected: {phoneNumber || "None"}
        </Text>
      </View>
    </View>
  );
}
