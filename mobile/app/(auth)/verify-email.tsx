import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { getItem, removeItem } from "@/lib/utils/storage";

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const params = useLocalSearchParams<{ email?: string }>();
    const { setAuth } = useAuthStore();
    const { setUser } = useUserStore();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const otpInputRef = useRef<TextInput>(null);
    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
            }
        };
    }, []);

    // Start cooldown timer when component mounts (after signup)
    useEffect(() => {
        setCooldown(60);
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        cooldownIntervalRef.current = interval;

        return () => clearInterval(interval);
    }, []);

    const handleVerify = async () => {
        if (!code || code.length < 6) {
            setError("Please enter a valid 6-digit verification code");
            return;
        }

        setError("");
        setLoading(true);
        try {
            // Use pending token if available for verifyEmail
            const pendingToken = await getItem("pendingAuthToken");
            if (pendingToken) {
                apiClient.setToken(pendingToken);
            }

            await apiClient.verifyEmail(code);

            // After successful verification, retrieve stored token and user from signup
            const storedToken = await getItem("pendingAuthToken");
            const pendingUserStr = await getItem("pendingUser");

            if (storedToken) {
                // Set auth token and user
                setAuth(storedToken);
                apiClient.setToken(storedToken);

                // Parse and set user if available
                if (pendingUserStr) {
                    try {
                        const user = JSON.parse(pendingUserStr);
                        setUser(user);
                    } catch {
                        // If parsing fails, fetch user from API
                        const user = await apiClient.getCurrentUser();
                        setUser(user);
                    }
                } else {
                    // Fetch user from API if not stored
                    const user = await apiClient.getCurrentUser();
                    setUser(user);
                }

                // Clean up temporary storage
                await removeItem("pendingAuthToken");
                await removeItem("pendingUser");
            } else {
                // Fallback: try to get user if token was already set
                try {
                    const user = await apiClient.getCurrentUser();
                    setUser(user);
                } catch {
                    // If that fails, user needs to sign in again
                    Alert.alert(
                        "Verification Complete",
                        "Your email has been verified. Please sign in to continue.",
                        [
                            {
                                text: "OK",
                                onPress: () => router.replace("/(auth)"),
                            },
                        ]
                    );
                    return;
                }
            }

            Alert.alert(
                "Email Verified",
                "Your email has been verified successfully!",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/(onboarding)"),
                    },
                ]
            );
        } catch (error: any) {
            setError(error.message || "Invalid verification code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) {
            return;
        }

        setResending(true);
        try {
            // Use pending token if available for resendVerification
            const pendingToken = await getItem("pendingAuthToken");
            if (pendingToken) {
                apiClient.setToken(pendingToken);
            }

            await apiClient.resendVerification();
            Alert.alert("Success", "Verification code has been resent to your email.");

            // Start 60s cooldown timer
            setCooldown(60);
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
            }
            const interval = setInterval(() => {
                setCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            cooldownIntervalRef.current = interval;
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to resend verification code.");
        } finally {
            setResending(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: Math.max(64, Math.floor(height * 0.08)),
                            paddingHorizontal: width < 390 ? 16 : 24,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        style={[styles.backArrow, { top: Math.max(32, Math.floor(height * 0.06)) }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={[styles.logoContainer, { marginTop: width < 390 ? 24 : 32 }]}>
                        <Ionicons name="mail-outline" size={80} color="#F2B138" />
                    </View>

                    <Text style={styles.title}>Verify Your Email</Text>
                    <Text style={styles.subtitle}>
                        We&apos;ve sent a verification code to {params.email || "your email address"}. Please enter it below.
                    </Text>

                    <TouchableOpacity style={styles.otpContainer} onPress={() => otpInputRef.current?.focus()}>
                        {Array.from({ length: 6 }).map((_, index) => {
                            const digit = code[index] || "";
                            const isActive = code.length === index;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.otpBox,
                                        isActive && styles.otpBoxActive,
                                    ]}
                                >
                                    <Text style={styles.otpDigit}>{digit}</Text>
                                </View>
                            );
                        })}
                        <TextInput
                            ref={otpInputRef}
                            value={code}
                            onChangeText={(text) => {
                                setCode(text.replace(/\D/g, "").slice(0, 6));
                                setError("");
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            style={styles.hiddenInput}
                            autoFocus
                        />
                    </TouchableOpacity>
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={resending || cooldown > 0}
                        >
                            {resending ? (
                                <ActivityIndicator size="small" color="#F2B138" />
                            ) : cooldown > 0 ? (
                                <Text style={styles.resendLinkDisabled}>
                                    Resend ({cooldown}s)
                                </Text>
                            ) : (
                                <Text style={styles.resendLink}>Resend</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.backToLoginText}>
                        <Link href="/(auth)" style={styles.link}>
                            Back to Sign In
                        </Link>
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingBottom: 40,
    },
    backArrow: {
        position: "absolute",
        left: 24,
        zIndex: 10,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 30,
        marginTop: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        textAlign: "center",
        color: "#282F2E",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        color: "#666",
        marginBottom: 40,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    otpContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    otpBox: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        backgroundColor: "#F9FBFB",
        alignItems: "center",
        justifyContent: "center",
    },
    otpBoxActive: {
        borderColor: "#F2B138",
        borderWidth: 2,
    },
    otpDigit: {
        fontSize: 22,
        fontWeight: "700",
        color: "#282F2E",
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0,
        width: 1,
        height: 1,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
        letterSpacing: 4,
        textAlign: "center",
    },
    errorText: {
        color: "#E57373",
        marginBottom: 10,
        fontSize: 12,
        textAlign: "center",
    },
    submitButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    resendText: {
        color: "#9E9E9E",
        fontSize: 14,
    },
    resendLink: {
        color: "#F2B138",
        fontSize: 14,
        fontWeight: "600",
    },
    resendLinkDisabled: {
        color: "#9E9E9E",
        fontSize: 14,
        fontWeight: "600",
    },
    backToLoginText: {
        textAlign: "center",
        color: "#9E9E9E",
        fontSize: 14,
        fontWeight: "400",
    },
    link: {
        color: "#F2B138",
        fontWeight: "600",
    },
});
