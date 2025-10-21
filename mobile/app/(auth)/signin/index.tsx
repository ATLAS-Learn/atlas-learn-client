import { SocialAuths } from "@/components/auth/social-auths";
import { RouteBack } from "@/components/global/route-back";
import { useAuthStore } from "@/store/auth";
import { Link } from "expo-router";
import { CheckIcon, LucideEye, LucideEyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: "",
  });

  const login = async () => {
    const fakeToken = "jwt_or_clerk_token";
    setAuth(fakeToken);
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 25,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <RouteBack />

          <View className="flex flex-col items-center w-full gap-6 mt-12">
            <Image
              source={require("@/assets/images/auth-screen-icon.png")}
              resizeMode="contain"
              style={{ width: 120, height: 120 }}
            />
            <Text className="text-center text-[32px] font-bold">Sign In</Text>
            <Text className="text-center text-[16px] font-light">
              Let&apos;s experience the joy of telecare AI.
            </Text>

            {/* Input fields */}
            <View className="w-full flex flex-col gap-4 mt-8">
              {/* Email */}
              <View className="w-full border border-gray-300 rounded-[16px] px-4 py-2 flex-row items-center gap-2 bg-[#ebebeb]">
                <Image
                  source={require("@/assets/images/icons/Profile.png")}
                  resizeMode="contain"
                  style={{ width: 20, height: 20 }}
                />
                <TextInput
                  placeholder="Email"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  className="flex-1 text-[16px] placeholder:text-gray-500"
                />
              </View>

              {/* Password */}
              <View className="w-full border border-gray-300 rounded-[16px] px-4 py-2 flex-row items-center gap-2 bg-[#ebebeb] relative">
                <Image
                  source={require("@/assets/images/icons/Lock.png")}
                  resizeMode="contain"
                  style={{ width: 20, height: 20 }}
                />
                <TextInput
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  className="flex-1 text-[16px] placeholder:text-gray-500 pr-10"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 16 }}
                >
                  {showPassword ? (
                    <LucideEye
                      size={20}
                      color={form.password.trim() ? "black" : "gray"}
                    />
                  ) : (
                    <LucideEyeOff
                      size={20}
                      color={form.password.trim() ? "black" : "gray"}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <View className="w-full flex-row justify-end mt-1">
                <Link href={"/(auth)/forgot-password"} asChild>
                  <Text className="text-[#F2B138] text-[14px] font-semibold">
                    Forgot Password?
                  </Text>
                </Link>
              </View>

              {/* Remember me */}
              <View className="w-full flex-row items-center gap-4 mt-2 justify-center">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    const current = form.remember === "true";
                    handleInputChange("remember", current ? "" : "true");
                  }}
                  className="flex-row items-center"
                >
                  <View
                    className={`w-[20px] h-[20px] rounded-sm items-center justify-center border-[2px] ${
                      form.remember === "true"
                        ? "bg-[#F2B138] border-[#F2B138]"
                        : "border-[#F2B138] bg-transparent"
                    }`}
                  >
                    {form.remember === "true" && (
                      <CheckIcon color="white" size={14} />
                    )}
                  </View>
                  <Text className="text-[14px] ml-3 font-semibold text-center">
                    Remember Me
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableHighlight
              underlayColor="#e0a52d"
              onPress={login}
              className="w-full bg-[#F2B138] rounded-full h-14 shadow-lg flex-row items-center justify-center mt-6"
            >
              <Text className="text-white font-semibold text-[16px]">
                Login
              </Text>
            </TouchableHighlight>

            {/* Divider */}
            <View className="w-full flex-row items-center justify-center gap-4 mt-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="text-[16px] font-light text-center">
                or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Social Auths */}
            <SocialAuths />

            {/* Sign Up Link */}
            <View className="w-full flex-row justify-center items-center gap-2 mt-4 mb-6">
              <Text className="text-black/60 text-[16px] font-light text-center">
                Don&apos;t have an account?
              </Text>
              <Link href={"/(auth)/signup"} asChild>
                <Text className="text-[#F2B138] text-[16px] font-semibold">
                  Sign Up
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* <Modal className="h-[30%] bg-black/20 opacity-5">
        <Text>Hello</Text>
      </Modal> */}
    </SafeAreaView>
  );
}
