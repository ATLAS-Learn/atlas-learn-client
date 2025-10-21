import React, { useState } from "react";
import { View } from "react-native";
import PhoneInput, {
  ICountry,
  isValidPhoneNumber,
} from "react-native-international-phone-number";

export function PhoneNumberInput() {
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [inputValue, setInputValue] = useState("");

  function handleInputValue(phoneNumber: string) {
    setInputValue(phoneNumber);
  }

  function handleSelectedCountry(country: any) {
    setSelectedCountry(country);
  }

  const isValidUserPhoneNumber = isValidPhoneNumber(
    inputValue,
    selectedCountry as ICountry
  );

  return (
    <View
      className={`w-full border border-gray-300 rounded-[16px] p-[11px] flex flex-row items-center gap-4 bg-[#ebebeb] ${
        !isValidUserPhoneNumber && inputValue.trim() !== ""
          ? "border-[1px] border-red-500 bg-red-100"
          : ""
      }`}
    >
      <PhoneInput
        placeholder="Phone Number"
        defaultCountry={"CM"}
        value={inputValue}
        onChangePhoneNumber={handleInputValue}
        selectedCountry={selectedCountry}
        onChangeSelectedCountry={handleSelectedCountry}
        phoneInputStyles={{
          container: {
            borderWidth: 0,
            backgroundColor: "transparent",
            outline: "none",
            height: "100%",
            width: "100%",
            gap: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          },
          input: {
            fontSize: 16,
            padding: 0,
            margin: 0,
            height: 40,
            flex: 1,
            borderWidth: 0,
            backgroundColor: "transparent",
            outline: "none",
            fontWeight: "600",
          },
          divider: {
            backgroundColor: "transparent",
          },
          callingCode: {
            fontSize: 16,
            fontWeight: "600",
          },

          flag: {
            backgroundColor: "transparent",
          },
          flagContainer: {
            backgroundColor: "transparent",
            width: "auto",
            padding: 0,
            paddingRight: 6,
          },
        }}
        modalStyles={{
          searchInput: {
            borderColor: "#E5E7EB",
            borderWidth: 1,
            borderRadius: 8,
            padding: 8,
            marginBottom: 10,
            fontSize: 16,
          },
          countryItem: {
            borderColor: "#E5E7EB",
            backgroundColor: "",
          },
        }}
      />
    </View>
  );
}
