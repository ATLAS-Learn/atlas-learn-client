// import React from "react";
// import { Button, Text, View } from "react-native";
// import { useAuthStore } from "../../store/auth";

// export default function Auth() {
//   const { setAuth } = useAuthStore();

//   const login = async () => {
//     // Replace with real API call and JWT/Clerk logic
//     const fakeToken = "jwt_or_clerk_token";
//     setAuth(fakeToken);
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text>Login to continue</Text>
//       <Button title="Login" onPress={login} />
//     </View>
//   );
// }

import { useState } from "react";
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
  Keyboard
} from "react-native";
import Checkbox from "expo-checkbox";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { FacebookIcon, GoogleIcon, AppleIcon } from "@/assets/images";
import { validateFields, ValidationErrors } from "@/utils/validate";


export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleSignIn = async () => {
    const newErrors = validateFields({
      email,
      password,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await signIn(email, password);
        setEmail("");
        setPassword("");
      } catch (error: any) {
        setErrors({ email: error.message || "Sign in failed" });
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

        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/Blue atlas icon.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Let’s experience the joy of telecare AI.</Text>

         {/* Email Input  */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={24} color="#B3B3B3" style={styles.icon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#B3B3B3"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        {errors.email && (
          <Text style={{ color: "red", marginBottom: 10 }}>{errors.email}</Text>
        )}

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed"
            size={24}
            color="#B3B3B3"
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#B3B3B3"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
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
          <Text style={{ color: "red", marginBottom: 10 }}>
            {errors.password}
          </Text>
        )}

        <TouchableOpacity style={styles.forgotTextCon}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.rememberBox}>
          <Checkbox
            value={remember}
            onValueChange={setRemember}
            color={remember ? "#F2B138" : undefined}
            style={styles.checkBox}
          />
          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Buttons */}
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

        <Text style={styles.signupText}>
          Don't have an account?{" "}
          <Link href="/(auth)/signup" style={styles.signupLink}>
            Sign up
          </Link>
        </Text>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
    justifyContent: "center",
  },
  backArrow: {
    position: "absolute",
    top: 60,
    left: 25,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
    marginTop:40

  },
  logo: {
    fontWeight: "bold",
    height: 200,
    width: 200,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    color: "#282F2E",
    marginBottom:10,
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
  forgotTextCon:{
    alignSelf: 'flex-end'
  },
  forgotText: {
    color: "#F2B138",
    fontWeight: "700",
    fontSize:14,
  },
  rememberBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:'center',
    gap:16,
    marginVertical:20
  },
  checkBox:{
    height:20,
    width:20,
    borderColor: "#F2B138",
    borderWidth:3,
    borderRadius: 5
  },
  rememberText: {
    color: "#0F172A",
    fontSize:14,
    fontWeight: "700"

  },

  loginButton: {
    backgroundColor: "#F2B138",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  orText: {
    marginHorizontal: 10,
    color: "#757575",
    fontSize:18,
    fontWeight:'700'
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
  },
  socialBtn: {
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    borderRadius: 50,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    backgroundColor: "#FFFFFF"
  },
  signupText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 14,
    fontWeight: "400",
  },
  signupLink: {
    color: "#F2B138",
    fontWeight: "600",
    fontSize: 14,
  },
});
