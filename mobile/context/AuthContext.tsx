import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setAuth, logout } = useAuthStore();

  //Auto-load user on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setAuth(storedToken);
        }
      } catch (e) {
        console.error("Error loading user:", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

    const signIn = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual backend API call
      const mockUser = {
        id: "1",
        name: "Test User",
        email: email,
      };
      const mockToken = "mock_jwt_token";
      
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      await AsyncStorage.setItem("token", mockToken);
      setUser(mockUser);
      setAuth(mockToken);
      router.replace("/(after-auth)");
    } catch (err: any) {
      throw new Error(err.message || "Unable to sign in");
    }
  };

    const signUp = async (name: string, email: string, password: string) => {
    try {
      // TODO: Replace with actual backend API call
      const mockUser = {
        id: "1",
        name: name,
        email: email,
      };
      const mockToken = "mock_jwt_token";
      
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      await AsyncStorage.setItem("token", mockToken);
      setUser(mockUser);
      setAuth(mockToken);
      router.replace("/(after-auth)");
    } catch (err: any) {
      throw new Error(err.message || "Unable to sign up");
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      setUser(null);
      logout();
      router.replace("/(auth)");
    } catch (err: any) {
      console.error("Error signing out:", err);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
