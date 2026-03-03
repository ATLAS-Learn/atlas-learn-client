import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { validateFields, ValidationErrors } from "@/lib/utils/validate";
import { apiClient } from "@/lib/api";

export default function SignIn() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleRequestOTP = async () => {
    const newErrors = validateFields({
      email,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await apiClient.requestOTP(email);
        // Navigate to OTP verification screen with email param
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email },
        });
      } catch (error: any) {
        const errorMessage = error.message || "Failed to send OTP. Please try again.";
        
        // If error is about email, show it inline
        if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("email")) {
          setErrors({ email: errorMessage });
        } else {
          Alert.alert("Error", errorMessage);
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
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(64, Math.floor(height * 0.08)),
              paddingHorizontal: width < 390 ? 16 : 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[styles.backArrow, { top: Math.max(32, Math.floor(height * 0.06)) }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <View style={[styles.logoContainer, { marginTop: width < 390 ? 24 : 32 }]}>
            <Image
              source={require("@/assets/images/Blue atlas icon.png")}
              style={[styles.logo, { height: width < 390 ? 130 : 170, width: width < 390 ? 130 : 170 }]}
            />
          </View>

          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>

          {/* Email Input  */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#B3B3B3"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleRequestOTP}
            />
          </View>
          {errors.email && (
            <Text style={{ color: "red", marginBottom: 10 }}>{errors.email}</Text>
          )}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleRequestOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Send OTP</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.signupText}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={styles.signupLink}>
              Sign up
            </Link>
          </Text>
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
    justifyContent: "center",
    paddingBottom: 100, // Increased bottom padding for keyboard
  },
  backArrow: {
    position: "absolute",
    left: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 32,
  },
  logo: {
    fontWeight: "bold",
    height: 170,
    width: 170,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    color: "#282F2E",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
    color: "#424E4C",
    marginBottom: 30,
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
  loginButton: {
    backgroundColor: "#F2B138",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 25,
  },
  signupLink: {
    color: "#F2B138",
    fontWeight: "600",
    fontSize: 14,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
});
