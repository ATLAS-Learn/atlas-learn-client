/**
 * Utility to reset the app by clearing all stored data
 * 
 * Usage:
 * import { resetApp } from '@/lib/utils/resetApp';
 * await resetApp();
 */

import { clearAllStorage } from "./clearStorage";

/**
 * Resets the app by clearing all storage (auth state change will redirect to login)
 * This is useful for development/testing or when you want to start fresh
 */
export async function resetApp(): Promise<void> {
  try {
    await clearAllStorage();
    console.log("✅ App reset complete. User should be redirected to login.");
  } catch (error) {
    console.error("❌ Error resetting app:", error);
    throw error;
  }
}
