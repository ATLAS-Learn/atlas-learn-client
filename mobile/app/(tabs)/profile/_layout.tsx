import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="quiz-scores" />
            <Stack.Screen name="assessment-result" />
            <Stack.Screen name="assessment-corrections" />
            <Stack.Screen name="quiz-corrections" />
        </Stack>
    );
}
