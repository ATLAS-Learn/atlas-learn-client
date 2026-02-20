import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PendingApprovalScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="hourglass-outline" size={60} color="#F2B138" />
        </View>

        <Text style={styles.title}>Request Submitted</Text>
        <Text style={styles.message}>
          Your request to upgrade to Teacher role is pending admin approval.
        </Text>
        <Text style={styles.subMessage}>
          You can continue using your student account while your request is being reviewed.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={22} color="#F2B138" />
          <Text style={styles.infoText}>
            You will automatically see teacher features once your role is approved by an admin.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <Text style={styles.backButtonText}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  iconCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#FFF8E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F2B138",
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#282F2E",
    marginBottom: 14,
    textAlign: "center",
  },
  message: {
    fontSize: 17,
    fontWeight: "600",
    color: "#282F2E",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 26,
  },
  infoBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF8E8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#282F2E",
    lineHeight: 20,
  },
  backButton: {
    width: "100%",
    backgroundColor: "#F2B138",
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 14,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
