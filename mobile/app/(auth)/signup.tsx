import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ValidationErrors, validateFields } from "@/lib/utils/validate";
import { apiClient } from "@/lib/api";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [school, setSchool] = useState("");
  const [examYear, setExamYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    apiClient.getSchools().then(setSchools).catch(() => {});
  }, []);

  const handleSignUp = async () => {
    const newErrors: ValidationErrors = validateFields({
      fullName,
      email,
      school,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await apiClient.signUpWithOTP({
          name: fullName,
          email,
          username: username.trim() || undefined,
          school: school.trim(),
          examYear: examYear.trim() ? Number(examYear) : undefined,
        });

        // Navigate to OTP verification screen
        router.replace({
          pathname: "/(auth)/verify-otp",
          params: { email, mode: "signup", fullName },
        });
      } catch (error: any) {
        const errorMessage = error.message || "An error occurred. Please try again.";

        // If error is about email already existing, show it inline
        if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("email")) {
          setErrors({ email: errorMessage });
        } else {
          Alert.alert("Signup Failed", errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            <Image
              source={require("@/assets/images/icon-yellow-transparent.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>Create New Account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#B3B3B3"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>
          {errors.email && (
            <Text style={{ color: "#E57373", marginBottom: 10 }}>{errors.email}</Text>
          )
          }
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#B3B3B3"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              returnKeyType="next"
            />
          </View>
          {errors.fullName && (
            <Text style={{ color: "#E57373", marginBottom: 10 }}>{errors.fullName}</Text>
          )
          }

          <View style={styles.inputContainer}>
            <Ionicons name="at" size={24} color="#B3B3B3" style={styles.icon} />
            <TextInput
              placeholder="Username (optional)"
              placeholderTextColor="#B3B3B3"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.inputContainer} onPress={() => { Keyboard.dismiss(); setShowSchoolPicker(true) }}>
            <Ionicons name="school-outline" size={24} color="#B3B3B3" style={styles.icon} />
            <Text style={[styles.inputText, !school && { color: "#B3B3B3" }]} numberOfLines={1} ellipsizeMode="tail">
              {school || "Select School"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#B3B3B3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputContainer} onPress={() => { Keyboard.dismiss(); setShowYearPicker(true) }}>
            <Ionicons name="calendar-outline" size={24} color="#B3B3B3" style={styles.icon} />
            <Text style={[styles.inputText, !examYear && { color: "#B3B3B3" }]} numberOfLines={1}>
              {examYear || "Exam Year (optional)"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#B3B3B3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Send OTP</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Link href="/(auth)" style={styles.loginLink}>
              Sign in
            </Link>
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>

    {/* School Picker Modal */}
    <Modal visible={showSchoolPicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select School</Text>
            <TouchableOpacity onPress={() => setShowSchoolPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder="Search schools..."
            placeholderTextColor="#999"
            value={schoolSearch}
            onChangeText={setSchoolSearch}
            autoCapitalize="none"
          />
          <FlatList
            data={schools.filter((s) => !schoolSearch || s.name.toLowerCase().includes(schoolSearch.toLowerCase()))}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, school === item.name && styles.modalItemActive]}
                onPress={() => { setSchool(item.name); setShowSchoolPicker(false); setSchoolSearch("") }}
              >
                <Text style={[styles.modalItemText, school === item.name && styles.modalItemTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>

    {/* Year Picker Modal */}
    <Modal visible={showYearPicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Exam Year</Text>
            <TouchableOpacity onPress={() => setShowYearPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i))}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, examYear === item && styles.modalItemActive]}
                onPress={() => { setExamYear(item); setShowYearPicker(false) }}
              >
                <Text style={[styles.modalItemText, examYear === item && styles.modalItemTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 20,
  },
  backArrow: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,

  },
  logo: {
    height: 170,
    width: 170,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#282F2E",
    marginBottom: 15
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
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 64,
    fontSize: 16,
    color: "#333",
  },
  inputText: {
    flex: 1,
    height: 64,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "center",
  },
  signUpButton: {
    backgroundColor: "#084A59",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  signUpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 20,
  },
  loginLink: {
    color: "#F2B138",
    fontWeight: "600",
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#282F2E",
  },
  modalSearch: {
    margin: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#F9FBFB",
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  modalItemActive: {
    backgroundColor: "#084A5910",
  },
  modalItemText: {
    fontSize: 15,
    color: "#333",
  },
  modalItemTextActive: {
    color: "#084A59",
    fontWeight: "600",
  },
});
