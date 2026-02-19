import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ValidationErrors, validateFields } from "@/lib/utils/validate";
import { apiClient } from "@/lib/api";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleSignUp = async () => {
    const newErrors: ValidationErrors = validateFields({
      fullName,
      email,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await apiClient.signUpWithOTP({
          name: fullName,
          email,
        });

        // Navigate to OTP verification screen
        router.replace({
          pathname: "/(auth)/verify-otp",
          params: { email, mode: "signup", fullName },
        });
      } catch (error: any) {
        const errorMessage = error.message || "An error occurred. Please try again.";
        
        // If error is about email already existing, show it inline
        if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("email")) {
          setErrors({ email: errorMessage });
        } else {
          Alert.alert("Signup Failed", errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/images/Blue atlas icon.png")} style={styles.logo} />
          </View>

          <Text style={styles.title}>Create New Account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#B3B3B3"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>
          {errors.email && (
            <Text style={{ color: "red", marginBottom: 10 }}>{errors.email}</Text>
          )
          }
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#B3B3B3"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              returnKeyType="next"
            />
          </View>
          {errors.fullName && (
            <Text style={{ color: "red", marginBottom: 10 }}>{errors.fullName}</Text>
          )
          }

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Send OTP</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Link href="/" style={styles.loginLink}>
              Sign in
            </Link>
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 100,
    paddingBottom: 100, // Increased bottom padding for keyboard
  },
  backArrow: {
    position: "absolute",
    top: 60,
    left: 25,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 90,
    marginBottom: 10,

  },
  logo: {
    fontWeight: "bold",
    height: 200,
    width: 200,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#282F2E",
    marginBottom: 15
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9FBFB",
    borderRadius: 16,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 64,
    fontSize: 16,
    color: "#333",
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderColor: "#F2B138",
    borderWidth: 3,
    borderRadius: 5,
    marginRight: 10,
  },
  termsText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
    flexWrap: "wrap",
  },
  link: {
    color: "#F2B138",
    fontWeight: "700",
  },
  signUpButton: {
    backgroundColor: "#F2B138",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  signUpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 20,
  },
  loginLink: {
    color: "#F2B138",
    fontWeight: "600",
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
});
