import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth";

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleSignOut = async () => {
    await logout();
    router.replace("/(auth)");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="hourglass-outline" size={64} color="#F2B138" />
          </View>
        </View>

        <Image
          source={require("@/assets/images/Blue atlas icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Pending Approval</Text>

        <Text style={styles.message}>
          Thank you for registering as a Teacher! Your account is currently pending admin approval.
        </Text>

        <Text style={styles.subMessage}>
          You will receive an email notification once your account has been approved. You can then sign in and access your teacher dashboard.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#F2B138" />
          <Text style={styles.infoText}>
            Please check your email for updates on your approval status.
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF8E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F2B138",
  },
  logo: {
    height: 120,
    width: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#282F2E",
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#282F2E",
    marginBottom: 15,
    lineHeight: 26,
  },
  subMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#757575",
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    width: "100%",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#282F2E",
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: "#F2B138",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
