import { useState } from "react";
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
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";

export default function VerifyEmailScreen() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!code || code.length < 4) {
            setError("Please enter a valid verification code");
            return;
        }

        setError("");
        setLoading(true);
        try {
            await apiClient.verifyEmail(code);
            Alert.alert(
                "Email Verified",
                "Your email has been verified successfully!",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/(auth)"),
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
        setResending(true);
        try {
            await apiClient.resendVerification();
            Alert.alert("Success", "Verification code has been resent to your email.");
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
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.logoContainer}>
                        <Ionicons name="mail-outline" size={80} color="#F2B138" />
                    </View>

                    <Text style={styles.title}>Verify Your Email</Text>
                    <Text style={styles.subtitle}>
                        We've sent a verification code to your email address. Please enter it below.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="keypad-outline" size={24} color="#B3B3B3" style={styles.icon} />
                        <TextInput
                            placeholder="Enter verification code"
                            placeholderTextColor="#B3B3B3"
                            value={code}
                            onChangeText={(text) => {
                                setCode(text);
                                setError("");
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            style={styles.input}
                            autoFocus
                        />
                    </View>
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
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        <TouchableOpacity onPress={handleResend} disabled={resending}>
                            {resending ? (
                                <ActivityIndicator size="small" color="#F2B138" />
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
        paddingHorizontal: 25,
        justifyContent: "center",
        paddingTop: 100,
        paddingBottom: 40,
    },
    backArrow: {
        position: "absolute",
        top: 60,
        left: 25,
        zIndex: 10,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 30,
        marginTop: 40,
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
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        backgroundColor: "#F9FBFB",
        borderRadius: 16,
        paddingHorizontal: 10,
        marginBottom: 15,
        height: 64,
    },
    icon: {
        marginRight: 10,
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
        color: "red",
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

