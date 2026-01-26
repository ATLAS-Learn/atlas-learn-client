import { Stack } from "expo-router";

export default function AfterAuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="chapters/[id]" />
            <Stack.Screen name="chapters/[id]/quiz" />
            <Stack.Screen name="chapters/[id]/quiz-result" />
            <Stack.Screen name="teacher/dashboard" />
            <Stack.Screen name="teacher/students/[id]" />
        </Stack>
    );
}

