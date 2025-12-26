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
    </Stack>
  );
}
