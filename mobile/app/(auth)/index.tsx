import React from "react";
import { Button, Text, View } from "react-native";
import { useAuthStore } from "../../store/auth";

export default function Auth() {
  const { setAuth } = useAuthStore();

  const login = async () => {
    // Replace with real API call and JWT/Clerk logic
    const fakeToken = "jwt_or_clerk_token";
    setAuth(fakeToken);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login to continue</Text>
      <Button title="Login" onPress={login} />
    </View>
  );
}
