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
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { validateFields, ValidationErrors } from "@/utils/validate";
import { apiClient } from "@/services/api";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ token?: string }>();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors & { confirmPassword?: string }>({});

    const handleResetPassword = async () => {
        const newErrors: ValidationErrors & { confirmPassword?: string } = validateFields({
            password,
        });

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const token = params.token;
            if (!token) {
                Alert.alert("Error", "Reset token is missing. Please use the link from your email.");
                return;
            }

            setLoading(true);
            try {
                await apiClient.resetPassword(token, password);
                Alert.alert(
                    "Success",
                    "Your password has been reset successfully.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace("/(auth)"),
                        },
                    ]
                );
            } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to reset password. Please try again.");
            } finally {
                setLoading(false);
            }
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
                        <Ionicons name="lock-closed-outline" size={80} color="#F2B138" />
                    </View>

                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your new password below.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={24} color="#B3B3B3" style={styles.icon} />
                        <TextInput
                            placeholder="New Password"
                            placeholderTextColor="#B3B3B3"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? "eye-off" : "eye"}
                                size={24}
                                color="#B3B3B3"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={24} color="#B3B3B3" style={styles.icon} />
                        <TextInput
                            placeholder="Confirm New Password"
                            placeholderTextColor="#B3B3B3"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={styles.input}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons
                                name={showConfirmPassword ? "eye-off" : "eye"}
                                size={24}
                                color="#B3B3B3"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Reset Password</Text>
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
});

