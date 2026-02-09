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
import Checkbox from "expo-checkbox";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ValidationErrors, validateFields } from "@/lib/utils/validate";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { setItem } from "@/lib/utils/storage";

export default function SignUpScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { setUser } = useUserStore();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Default avatar URL - can be updated later
  const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=F2B138&color=fff&size=200";

  const handleSignUp = async () => {
    const newErrors: ValidationErrors = validateFields({
      fullName,
      email,
      password,
    });

    if (!isChecked) {
      Alert.alert("Terms Required", "Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const response = await apiClient.signup({
          name: fullName,
          email,
          password,
          image: DEFAULT_AVATAR,
        });

        setAuth(response.token);
        setUser(response.user);

        // Route to onboarding for assessment
        router.replace("/(onboarding)");
      } catch (error: any) {
        Alert.alert("Signup Failed", error.message || "An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
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
            />
          </View>
          {errors.fullName && (
            <Text style={{ color: "red", marginBottom: 10 }}>{errors.fullName}</Text>
          )
          }

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#B3B3B3"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#B3B3B3"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={{ color: "red", marginBottom: 10 }}>{errors.password}</Text>
          )
          }

          <View style={styles.termsContainer}>
            <Checkbox
              value={isChecked}
              onValueChange={setIsChecked}
              color={isChecked ? "#F2B138" : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.termsText}>
              I Agree with{" "}
              <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Sign Up</Text>
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
    paddingHorizontal: 25,
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