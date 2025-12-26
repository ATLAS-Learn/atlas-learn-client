import { useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import PhoneInput from "react-native-phone-number-input";

type PhoneNumberInputProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
};

export default function PhoneNumberInput({ 
  value, 
  onChangeText,
  error 
}: PhoneNumberInputProps) {
  const phoneInput = useRef<PhoneInput>(null);
  const [phoneNumber, setPhoneNumber] = useState(value || "");

  const handleChange = (text: string) => {
    setPhoneNumber(text);
    onChangeText?.(text);
  };

  return (
    <View>
      <PhoneInput
        ref={phoneInput}
        defaultCode="CM"
        layout="first"
        withDarkTheme={false}
        withShadow={false}
        value={phoneNumber}
        onChangeFormattedText={handleChange}
        containerStyle={styles.container}
        textContainerStyle={styles.textContainer}
        countryPickerProps={{
          withFlag: true,
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#F9FBFB",
    marginBottom: 15,
  },
  textContainer: {
    borderRadius: 16,
    backgroundColor: "#F9FBFB",
  },
  errorText: {
    color: "red",
    marginTop: -10,
    marginBottom: 10,
    fontSize: 14,
  },
});
