import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPassword() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isValidPassword = password.length >= 8;

  const handleContinue = async () => {
    if (!isValidPassword || !passwordsMatch) return;

    setIsChanging(true);
    
    setTimeout(() => {
      setIsChanging(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace("/(auth)");
      }, 2000);
    }, 1500);
  };

  const styles = getStyles(isDark);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={isDark ? "#FFFFFF" : "#000000"} 
        />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a code to reset your password
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.iconLeft}>
            <Ionicons 
              name="lock-closed" 
              size={20} 
              color={isDark ? "#B0B0B0" : "#B3B3B3"} 
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="**************"
            placeholderTextColor={isDark ? "#666666" : "#B3B3B3"}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={isDark ? "#B0B0B0" : "#B3B3B3"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>Must have at least 8 characters</Text>

        <View style={[
          styles.inputContainer,
          confirmPassword && !passwordsMatch && styles.inputError,
          confirmPassword && passwordsMatch && styles.inputSuccess,
        ]}>
          <View style={styles.iconLeft}>
            <Ionicons 
              name="lock-closed" 
              size={20} 
              color={
                confirmPassword && passwordsMatch 
                  ? "#F2B138" 
                  : isDark ? "#B0B0B0" : "#B3B3B3"
              } 
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="!#$tr0ng_P@$sW0rD!"
            placeholderTextColor={isDark ? "#666666" : "#B3B3B3"}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color={
                confirmPassword && passwordsMatch 
                  ? "#F2B138" 
                  : isDark ? "#B0B0B0" : "#B3B3B3"
              }
            />
          </TouchableOpacity>
          {confirmPassword && passwordsMatch && (
            <View style={styles.iconCheck}>
              <Ionicons name="checkmark-circle" size={20} color="#F2B138" />
            </View>
          )}
        </View>
        {confirmPassword && !passwordsMatch && (
          <Text style={styles.errorText}>Both passwords must match</Text>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!isValidPassword || !passwordsMatch) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isValidPassword || !passwordsMatch || isChanging}
        >
          {isChanging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Changing Password Modal */}
      <Modal visible={isChanging} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ActivityIndicator size="large" color="#F2B138" />
            <Text style={styles.modalTitle}>Changing Password</Text>
            <Text style={styles.modalSubtitle}>
              Password changed successfully, you can login again with a new password
            </Text>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.successIcon}>
              <View style={styles.successIconInner}>
                <Ionicons name="lock-closed" size={40} color="#3B82F6" />
              </View>
              <View style={[styles.particle, { top: -10, left: -10 }]}>
                <Text style={{ fontSize: 20 }}>✨</Text>
              </View>
              <View style={[styles.particle, { top: -5, right: -15 }]}>
                <Text style={{ fontSize: 16, color: "#EC4899" }}>+</Text>
              </View>
              <View style={[styles.particle, { bottom: -10, left: -15 }]}>
                <Text style={{ fontSize: 18, color: "#8B5CF6" }}>●</Text>
              </View>
              <View style={[styles.particle, { top: 5, right: -20 }]}>
                <Text style={{ fontSize: 20, color: "#3B82F6" }}>~</Text>
              </View>
              <View style={[styles.particle, { bottom: -5, right: -10 }]}>
                <Text style={{ fontSize: 16, color: "#10B981" }}>●</Text>
              </View>
            </View>
            <Text style={styles.successTitle}>Password Changed</Text>
            <Text style={styles.successSubtitle}>
              Password changed successfully, you can login again with a new password
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccess(false);
                router.replace("/(auth)");
              }}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
    },
    backButton: {
      position: "absolute",
      top: 60,
      left: 25,
      zIndex: 10,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 25,
      paddingTop: 120,
      paddingBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#282F2E",
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? "#B0B0B0" : "#424E4C",
      marginBottom: 40,
      lineHeight: 24,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#333333" : "#E0E0E0",
      backgroundColor: isDark ? "#2A2A2A" : "#F9FBFB",
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 64,
      marginBottom: 8,
    },
    inputError: {
      borderColor: "#EF4444",
      borderWidth: 2,
    },
    inputSuccess: {
      borderColor: "#F2B138",
      borderWidth: 2,
      backgroundColor: isDark ? "#2A2A2A" : "#FFF9F0",
    },
    iconLeft: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#333",
      height: "100%",
    },
    iconRight: {
      marginLeft: 12,
    },
    iconCheck: {
      marginLeft: 8,
    },
    helperText: {
      fontSize: 14,
      color: isDark ? "#B0B0B0" : "#6B7280",
      marginBottom: 20,
    },
    errorText: {
      fontSize: 14,
      color: "#EF4444",
      marginBottom: 20,
    },
    continueButton: {
      backgroundColor: "#F2B138",
      paddingVertical: 18,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
      shadowColor: "#F2B138",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    continueButtonDisabled: {
      backgroundColor: isDark ? "#3A3A3A" : "#CCCCCC",
      shadowOpacity: 0,
    },
    continueButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
      borderRadius: 30,
      padding: 40,
      alignItems: "center",
      minWidth: 300,
      maxWidth: 340,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#0F172A",
      marginTop: 20,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: isDark ? "#B0B0B0" : "#6B7280",
      textAlign: "center",
      lineHeight: 20,
    },
    successIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#E0F2FE",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    successIconInner: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#FFFFFF",
      borderWidth: 3,
      borderColor: "#3B82F6",
      alignItems: "center",
      justifyContent: "center",
    },
    particle: {
      position: "absolute",
    },
    successTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#F2B138",
      marginTop: 20,
      marginBottom: 12,
    },
    successSubtitle: {
      fontSize: 14,
      color: isDark ? "#B0B0B0" : "#6B7280",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    successButton: {
      backgroundColor: "#F2B138",
      paddingVertical: 16,
      paddingHorizontal: 60,
      borderRadius: 25,
    },
    successButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
