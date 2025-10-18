import "@/styles/global.css";
import { Stack } from "expo-router";
import React from "react";
import { FontLoader } from "../components/font-loader";

export default function RootLayout() {
  return (
    <FontLoader>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerStyle: {},
          }}
        />
      </Stack>
    </FontLoader>
  );
}
