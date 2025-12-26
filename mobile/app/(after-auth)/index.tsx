import { Link } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Atlas Learn! 🎉</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
        
        <View style={styles.linksContainer}>
          <Link href="/(intro)" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Go to Intro Screen</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Go to Auth Screen</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={signOut}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#282F2E",
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#282F2E",
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  linksContainer: {
    gap: 12,
    marginTop: 20,
  },
  linkButton: {
    backgroundColor: "#F2B138",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  linkText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
