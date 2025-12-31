import { useState } from "react";
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
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import Checkbox from "expo-checkbox";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FacebookIcon, GoogleIcon, AppleIcon } from "@/assets/images";
import PhoneNumberInput from "@/components/phone-select-dropdown";
import { ValidationErrors, validateFields } from "@/utils/validate";
import { useAuth } from "@/context/AuthContext";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleSignUp = async () => {
    const newErrors = validateFields({
      fullName,
      email,
      password,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await signUp(fullName, email, password);
        setEmail("");
        setPassword("");
        setFullName("");
        setPhone("");
      } catch (error: any) {
        setErrors({ email: error.message || "Sign up failed" });
      } finally {
        setLoading(false);
      }
    }
  };


  const styles = getStyles(isDark);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000"} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/images/Blue atlas icon.png")} style={styles.logo} />
          </View>

          <Text style={styles.title}>Create New Account</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialBtn}>
              <Image source={FacebookIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Image source={GoogleIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Image source={AppleIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <PhoneNumberInput 
            value={phone}
            onChangeText={setPhone}
          />

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color={isDark ? "#B0B0B0" : "#B3B3B3"} style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor={isDark ? "#666666" : "#B3B3B3"}
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
            <Ionicons name="person" size={24} color={isDark ? "#B0B0B0" : "#B3B3B3"} style={styles.icon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={isDark ? "#666666" : "#B3B3B3"}
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
            <Ionicons name="lock-closed" size={24} color={isDark ? "#B0B0B0" : "#B3B3B3"} style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={isDark ? "#666666" : "#B3B3B3"}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={isDark ? "#B0B0B0" : "#B3B3B3"}
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
            style={styles.signUpButton}
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
            <Link href="/(auth)" style={styles.loginLink}>
              Sign in
            </Link>
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#1A1A1A" : "#fff",
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
      color: isDark ? "#FFFFFF" : "#282F2E",
      marginBottom: 15,
    },
    socialContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 5,
    },
    socialBtn: {
      borderWidth: 0.5,
      borderColor: isDark ? "#444444" : "#CBD5E1",
      borderRadius: 50,
      width: 60,
      height: 60,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 8,
      backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 25,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#333333" : "#EEEEEE",
    },
    orText: {
      marginHorizontal: 10,
      color: isDark ? "#B0B0B0" : "#757575",
      fontSize: 16,
      fontWeight: "700",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#333333" : "#E0E0E0",
      backgroundColor: isDark ? "#2A2A2A" : "#F9FBFB",
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
      color: isDark ? "#FFFFFF" : "#333",
    },
    countryCode: {
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#333",
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
      color: isDark ? "#FFFFFF" : "#0F172A",
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
      shadowColor: "#F2B138",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    signUpText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    loginText: {
      textAlign: "center",
      color: isDark ? "#B0B0B0" : "#9E9E9E",
      fontSize: 14,
      fontWeight: "400",
      marginTop: 20,
    },
    loginLink: {
      color: "#F2B138",
      fontWeight: "600",
    },
  });