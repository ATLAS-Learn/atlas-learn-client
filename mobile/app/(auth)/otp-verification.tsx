import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OTPVerification() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(55);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.some((digit) => !digit)) return;

    Keyboard.dismiss();
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/(auth)/reset-password");
      }, 2000);
    }, 1500);
  };

  const handleResend = () => {
    setTimer(55);
    setOtp(["", "", "", ""]);
    inputRefs.current[0]?.focus();
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
        <Text style={styles.title}>OTP Code Verification</Text>
        <Text style={styles.subtitle}>
          Code has been send to +237 6******31
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                index === otp.findIndex((d) => !d) && styles.otpInputActive,
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Text style={styles.timerText}>
          Resend code in <Text style={styles.timerHighlight}>{timer}</Text> s
        </Text>

        <TouchableOpacity
          style={[styles.verifyButton, otp.some((d) => !d) && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={otp.some((d) => !d) || isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        {timer === 0 && (
          <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verifying Modal */}
      <Modal visible={isVerifying} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ActivityIndicator size="large" color="#F2B138" />
            <Text style={styles.modalTitle}>Verifying Code</Text>
            <Text style={styles.modalSubtitle}>We are verifying the code...</Text>
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
            <Text style={styles.successTitle}>Code Verified</Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowSuccess(false);
                router.push("/(auth)/reset-password");
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
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
    },
    otpContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      gap: 12,
    },
    otpInput: {
      flex: 1,
      height: 70,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#333333" : "#E0E0E0",
      backgroundColor: isDark ? "#2A2A2A" : "#F9FBFB",
      fontSize: 32,
      fontWeight: "700",
      textAlign: "center",
      color: isDark ? "#FFFFFF" : "#0F172A",
    },
    otpInputFilled: {
      borderColor: "#F2B138",
      backgroundColor: isDark ? "#2A2A2A" : "#FFF9F0",
    },
    otpInputActive: {
      borderColor: "#F2B138",
      borderWidth: 2,
    },
    timerText: {
      textAlign: "center",
      fontSize: 16,
      color: isDark ? "#B0B0B0" : "#6B7280",
      marginBottom: 30,
    },
    timerHighlight: {
      color: "#F2B138",
      fontWeight: "600",
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
    resendButton: {
      marginTop: 20,
      alignItems: "center",
    },
    resendText: {
      color: "#F2B138",
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
      marginBottom: 20,
    },
    continueButton: {
      backgroundColor: "#F2B138",
      paddingVertical: 16,
      paddingHorizontal: 60,
      borderRadius: 25,
    },
    continueButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
