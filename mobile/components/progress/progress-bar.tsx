import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, LayoutAnimation, Platform, UIManager } from "react-native";

interface ProgressBarProps {
    progress: number; // 0-100
}

const TEAL = "#1A5C6B";

if (Platform.OS === "android") {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function ProgressBar({ progress }: ProgressBarProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.create(
            600,
            LayoutAnimation.Types.easeInEaseOut,
            LayoutAnimation.Properties.opacity
        ));
    }, [progress]);

    useEffect(() => {
        if (progress <= 0) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [progress, pulseAnim]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Overall Progress</Text>
                <Animated.Text style={[styles.percentage, { transform: [{ scale: pulseAnim }] }]}>
                    {Math.round(progress)}%
                </Animated.Text>
            </View>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(Math.max(progress, 0), 100)}%` }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#282F2E",
    },
    percentage: {
        fontSize: 16,
        fontWeight: "700",
        color: TEAL,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: "#E0E0E0",
        borderRadius: 6,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: TEAL,
        borderRadius: 6,
    },
});
