import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Onboarding() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const handleStartAssessment = () => {
    router.push("/(onboarding)/assessment");
  };

  const contentPadding = width < 390 ? 16 : 24;
  const iconSize = width < 390 ? 64 : 80;
  const titleSize = width < 390 ? 24 : 28;
  const descriptionSize = width < 390 ? 14 : 16;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { padding: contentPadding, paddingTop: Math.max(24, Math.floor(height * 0.08)) }]}>
      <View style={[styles.iconContainer, { width: iconSize + 40, height: iconSize + 40, borderRadius: (iconSize + 40) / 2 }]}>
        <Ionicons name="school-outline" size={iconSize} color="#F2B138" />
      </View>

      <Text style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.3) }]}>
        Find Your Perfect Starting Point
      </Text>

      <Text style={[styles.description, { fontSize: descriptionSize }]}>
        We&apos;ll ask you 5 questions to understand your current knowledge level.
        This helps us give you the right material tailored to your needs.
      </Text>

      <View style={styles.benefitsContainer}>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Personalized learning path</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Content at your level</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Build confidence step by step</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartAssessment}
      >
        <Text style={styles.startButtonText}>Start Assessment</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF9E6",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#282F2E",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: 40,
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  startButton: {
    backgroundColor: "#F2B138",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 200,
    justifyContent: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
