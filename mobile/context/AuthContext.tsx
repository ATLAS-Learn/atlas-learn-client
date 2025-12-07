import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  //Auto-load user on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
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
      //  backend API call
      router.replace("/"); // redirect after login
    } catch (err: any) {
      throw new Error(err.message || "Unable to sign in");
    }
  };

    const signUp = async (name: string, email: string, password: string) => {
    try {  
      router.replace("/");
    } catch (err: any) {
      throw new Error(err.message || "Unable to sign up");
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
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
