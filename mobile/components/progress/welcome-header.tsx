import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WelcomeHeaderProps {
    name: string;
    streak: number;
}

export default function WelcomeHeader({ name, streak }: WelcomeHeaderProps) {
    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{name}!</Text>
            </View>
            {streak > 0 && (
                <View style={styles.streakContainer}>
                    <Ionicons name="flame" size={24} color="#F2B138" />
                    <Text style={styles.streakText}>{streak}-Day Streak</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 16,
        color: "#666",
        marginBottom: 4,
    },
    nameText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#282F2E",
    },
    streakContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FFF9E6",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    streakText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#F2B138",
    },
});
