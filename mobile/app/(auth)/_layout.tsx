import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFFFF" }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
