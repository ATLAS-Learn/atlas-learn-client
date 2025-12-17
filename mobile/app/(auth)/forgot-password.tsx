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
import { validateFields, ValidationErrors } from "@/utils/validate";
import { apiClient } from "@/services/api";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [emailSent, setEmailSent] = useState(false);

    const handleForgotPassword = async () => {
        const newErrors = validateFields({ email });

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setLoading(true);
            try {
                await apiClient.forgotPassword(email);
                setEmailSent(true);
                Alert.alert(
                    "Email Sent",
                    "Please check your email for password reset instructions."
                );
            } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to send reset email. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    if (emailSent) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.successContainer}>
                    <Ionicons name="mail-outline" size={80} color="#4CAF50" />
                    <Text style={styles.successTitle}>Check Your Email</Text>
                    <Text style={styles.successText}>
                        We've sent password reset instructions to {email}
                    </Text>
                    <TouchableOpacity
                        style={styles.backToLoginButton}
                        onPress={() => router.replace("/(auth)")}
                    >
                        <Text style={styles.backToLoginText}>Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

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
                        <Ionicons name="lock-closed-outline" size={80} color="#F2B138" />
                    </View>

                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we'll send you instructions to reset your password.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail" size={24} color="#B3B3B3" style={styles.icon} />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#B3B3B3"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                        />
                    </View>
                    {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleForgotPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.backToLoginText}>
                        Remember your password?{" "}
                        <Link href="/(auth)" style={styles.link}>
                            Sign in
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
        fontSize: 16,
        color: "#333",
    },
    errorText: {
        color: "red",
        marginBottom: 10,
        fontSize: 12,
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
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#282F2E",
        marginTop: 24,
        marginBottom: 16,
        textAlign: "center",
    },
    successText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
    },
    backToLoginButton: {
        backgroundColor: "#F2B138",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        minWidth: 200,
        alignItems: "center",
    },
});

