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
<<<<<<< HEAD
            <Stack.Screen name="admin-quiz-analytics" />
            <Stack.Screen name="admin-users" />
            <Stack.Screen name="admin-analytics" />
=======
            <Stack.Screen name="admin-feedback" />
>>>>>>> a002d08eb23fa2a95a9ce0a65519a47508d9f906
        </Stack>
    );
}
