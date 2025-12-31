import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type ContactMethod = "whatsapp" | "email" | null;

export default function ForgotPassword() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!selectedMethod) return;
    
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      router.push("/(auth)/otp-verification");
    }, 1500);
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={isDark ? "#FFFFFF" : "#000000"} 
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Select which contact details should we use to reset your password.
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMethod === "whatsapp" && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedMethod("whatsapp")}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="logo-whatsapp" 
                size={24} 
                color={isDark ? "#FFFFFF" : "#424E4C"} 
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Send via WhatsApp</Text>
              <Text style={styles.optionValue}>+(237) 654 935 347</Text>
            </View>
            {selectedMethod === "whatsapp" && (
              <Ionicons name="checkmark-circle" size={24} color="#F2B138" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMethod === "email" && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedMethod("email")}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="mail" 
                size={24} 
                color={isDark ? "#FFFFFF" : "#424E4C"} 
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Send via Email</Text>
              <Text style={styles.optionValue}>devguyuix@yourdomain.com</Text>
            </View>
            {selectedMethod === "email" && (
              <Ionicons name="checkmark-circle" size={24} color="#F2B138" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, !selectedMethod && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={!selectedMethod || isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={isVerifying} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#F2B138" />
            <Text style={styles.loadingText}>Sending verification code...</Text>
          </View>
        </View>
      </Modal>
    </View>
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
    content: {
      flex: 1,
      paddingHorizontal: 25,
      paddingTop: 120,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    icon: {
      fontSize: 80,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
      color: isDark ? "#FFFFFF" : "#282F2E",
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      textAlign: "center",
      color: isDark ? "#B0B0B0" : "#424E4C",
      marginBottom: 40,
      lineHeight: 24,
    },
    optionsContainer: {
      gap: 16,
      marginBottom: 40,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#333333" : "#E0E0E0",
      backgroundColor: isDark ? "#2A2A2A" : "#F9FBFB",
    },
    optionCardSelected: {
      borderColor: "#F2B138",
      borderWidth: 2,
      backgroundColor: isDark ? "#2A2A2A" : "#FFF9F0",
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? "#3A3A3A" : "#E8EEF1",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    optionText: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 14,
      color: isDark ? "#B0B0B0" : "#6B7280",
      marginBottom: 4,
    },
    optionValue: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#0F172A",
    },
    verifyButton: {
      backgroundColor: "#F2B138",
      paddingVertical: 18,
      borderRadius: 25,
      alignItems: "center",
      shadowColor: "#F2B138",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    verifyButtonDisabled: {
      backgroundColor: isDark ? "#3A3A3A" : "#CCCCCC",
      shadowOpacity: 0,
    },
    verifyButtonText: {
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
    loadingModal: {
      backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
      borderRadius: 20,
      padding: 30,
      alignItems: "center",
      minWidth: 200,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#282F2E",
      textAlign: "center",
    },
  });
