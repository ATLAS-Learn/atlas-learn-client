import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export default function ScreenHeader({
    title,
    onBack,
    showBack = true,
    rightAction,
}: ScreenHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <View style={styles.leftRow}>
                {showBack && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                </Text>
            </View>
            {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: "#084A59",
    },
    leftRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFF",
        flex: 1,
    },
    rightAction: {
        marginLeft: 8,
    },
});
