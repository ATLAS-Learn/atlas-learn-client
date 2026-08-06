import { Stack } from "expo-router";

export default function LearnLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="browse-subjects" />
            <Stack.Screen name="chapters" />
            <Stack.Screen name="subjects/index" />
            <Stack.Screen name="subjects/[subjectId]" />
            <Stack.Screen name="[id]/index" />
            <Stack.Screen name="[id]/quiz" />
            <Stack.Screen name="[id]/quiz-result" />
            <Stack.Screen name="[id]/lessons/index" />
            <Stack.Screen name="[id]/lessons/[lessonId]" />
        </Stack>
    );
}
