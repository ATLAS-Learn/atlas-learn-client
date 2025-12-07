import React, { useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import PhoneInput from "react-native-phone-number-input";

export default function PhoneNumberInput() {
  const phoneInput = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <View>
      <PhoneInput
        ref={phoneInput}
        defaultCode="CM"
        layout="first"
        withDarkTheme={false}
        withShadow={false}
        value={phoneNumber}
        onChangeFormattedText={(text) => setPhoneNumber(text)}
        containerStyle={styles.container}
        textContainerStyle={styles.textContainer}
        countryPickerProps={{
          withFlag: true,
        }}
      />

      <Text style={styles.selectedText}>
        Selected: {phoneNumber || "None"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#F9FBFB",
  },
  textContainer: {
    borderRadius: 16,
    backgroundColor: "#F9FBFB",
  },
  selectedText: {
    marginTop: 8,
    textAlign: "center",
    color: "#666",
  },
});
