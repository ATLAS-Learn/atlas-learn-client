import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="quiz-scores" />
            <Stack.Screen name="assessment-result" />
            <Stack.Screen name="assessment-corrections" />
            <Stack.Screen name="quiz-corrections" />
            <Stack.Screen name="pending-approval" />
            <Stack.Screen name="admin-role-upgrades" />
            <Stack.Screen name="admin-assessments" />
            <Stack.Screen name="admin-subjects" />
        </Stack>
    );
}
