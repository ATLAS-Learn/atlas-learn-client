import { Stack } from "expo-router";

export default function LearnLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]/index" />
            <Stack.Screen name="[id]/quiz" />
            <Stack.Screen name="[id]/quiz-result" />
        </Stack>
    );
}
