import { SocialAuths } from "@/components/auth/social-auths";
import { useAuthStore } from "@/store/auth";
import { Link } from "expo-router";
import { CheckIcon, LucideEye, LucideEyeOff } from "lucide-react-native"; // or any icon lib you use
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const login = async () => {
    // Replace with real API call and JWT/Clerk logic
    const fakeToken = "jwt_or_clerk_token";
    setAuth(fakeToken);
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  return (
    <ScrollView>
      <View className="p-[25px] flex-1 justify-center items-center h-full w-full">
        <View className="w-full flex flex-row items-center justify-start ">
          <Link href={"/"} asChild>
            <Image
              source={require("@/assets/images/icons/arrow-left.png")}
              resizeMode="contain"
            />
          </Link>
        </View>
        <View className="flex flex-col items-center w-full gap-6 mt-12 flex-1">
          <Image
            source={require("@/assets/images/auth-screen-icon.png")}
            resizeMode="contain"
          />
          <Text className="text-center text-[36px] font-bold">Sign In</Text>
          <Text className="text-center text-[16px] font-light">
            Let&apos;s experience the joy of telecare AI.
          </Text>

          {/* Socials auth (Facebook / Google / Apple) */}
          <SocialAuths />

          {/* Input fields */}
          <View className="w-full flex flex-col gap-4 mt-8">
            <View className="w-full border border-gray-300 rounded-[16px] py-[24px] p-[20px] flex flex-row items-center gap-4 bg-[#ebebeb]">
              <Image
                source={require("@/assets/images/icons/Profile.png")}
                resizeMode="contain"
              />
              <TextInput
                placeholder="Email"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => handleInputChange("email", text)}
                className="w-full h-full border-none outline-none focus:outline-none focus-visible:outline-none placeholder:text-gray-500 text-[16px] bg-transparent  "
              />
            </View>
            <View className="w-full border border-gray-300 rounded-[16px] py-[24px] p-[20px] flex flex-row items-center gap-4 bg-[#ebebeb]">
              <Image
                source={require("@/assets/images/icons/Lock.png")}
                resizeMode="contain"
              />
              <TextInput
                placeholder="Password"
                keyboardType="default"
                value={form.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry={!showPassword}
                className="w-full h-full border-none outline-none focus:outline-none focus-visible:outline-none placeholder:text-gray-500 text-[16px] bg-transparent  "
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <LucideEye
                    size={20}
                    color={form.password.trim() !== "" ? "black" : "gray"}
                  />
                ) : (
                  <LucideEyeOff
                    size={20}
                    color={form.password.trim() !== "" ? "black" : "gray"}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View className="w-full flex flex-row justify-end">
              <Link href={"/(auth)/forgot-password"} asChild>
                <Text className="text-[#F2B138] text-[14px] font-semibold">
                  Forgot Password?
                </Text>
              </Link>
            </View>

            {/* Remember me check box */}
            <View className="w-full flex flex-row items-center justify-center gap-4 mt-2">
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex flex-row items-center"
                onPress={() => {
                  const current = (form as any).remember === "true";
                  handleInputChange("remember", current ? "" : "true");
                }}
              >
                <View
                  className={`w-[24px] h-[24px] rounded-sm flex items-center justify-center border-[3px] ${
                    (form as any).remember === "true"
                      ? "bg-[#F2B138] border-[#F2B138]"
                      : "border-[#F2B138] bg-transparent"
                  }`}
                >
                  {(form as any).remember === "true" ? (
                    <CheckIcon color="white" size={16} />
                  ) : null}
                </View>
                <Text className="text-[14px] ml-3 font-semibold">
                  Remember Me
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableHighlight className="w-full bg-[#F2B138] rounded-full h-[3.8rem] shadow-lg p-[16px] flex flex-row items-center justify-center">
            <Text
              className="text-center text-white font-semibold text-[16px]"
              onPress={login}
            >
              Login
            </Text>
          </TouchableHighlight>

          {/* Sign up link */}
          <View className="w-full flex flex-row justify-center items-center gap-2">
            <Text className="text-black/60 text-[18px] font-light leading-[28.80px] break-words text-center">
              Don&apos;t have an account?
            </Text>
            <Link href={"/(auth)/signup"} asChild>
              <Text className="text-[#F2B138] text-[14px] font-semibold">
                Sign Up
              </Text>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
