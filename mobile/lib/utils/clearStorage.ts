import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";
import { useProgressStore } from "@/lib/store/progress";

/**
 * Clears all stored user data from AsyncStorage and Zustand stores
 * This includes:
 * - Authentication token
 * - User data
 * - Progress data
 * - Assessment completion status
 * - Onboarding completion status
 */
export async function clearAllStorage(): Promise<void> {
  try {
    // Clear all AsyncStorage keys
    const keys = [
      "authToken",
      "user",
      "progress",
      "assessmentComplete",
      "onboardingComplete",
    ];

    await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));

    // Clear Zustand stores (without API calls)
    const { setAuth } = useAuthStore.getState();
    const { clearUser } = useUserStore.getState();
    const { clearProgress } = useProgressStore.getState();

    // Clear auth state without calling logout API
    setAuth(null);
    await clearUser();
    await clearProgress();

    console.log("✅ All storage cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing storage:", error);
    throw error;
  }
}

/**
 * Alternative: Clear all AsyncStorage (more aggressive, clears everything)
 */
export async function clearAllAsyncStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
    console.log("✅ All AsyncStorage cleared");
  } catch (error) {
    console.error("❌ Error clearing AsyncStorage:", error);
    throw error;
  }
}
