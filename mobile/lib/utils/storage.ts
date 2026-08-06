import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type MMKVStore = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys?: () => string[];
};

let mmkvStore: MMKVStore | null | undefined;

const isServer = typeof window === "undefined";

function getMMKVStore(): MMKVStore | null {
  if (Platform.OS === "web" || isServer) {
    return null;
  }

  if (mmkvStore !== undefined) {
    return mmkvStore;
  }

  try {
    // Lazy-load so web and test environments can fall back cleanly.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require("react-native-mmkv");
    mmkvStore = new MMKV({ id: "atlas-storage" }) as MMKVStore;
    return mmkvStore;
  } catch {
    mmkvStore = null;
    return null;
  }
}

export const storage = {
  async getItem(key: string) {
    const mmkv = getMMKVStore();
    if (mmkv) {
      return mmkv.getString(key) ?? null;
    }
    if (isServer) return null;
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    const mmkv = getMMKVStore();
    if (mmkv) {
      mmkv.set(key, value);
      return;
    }
    if (isServer) return;
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    const mmkv = getMMKVStore();
    if (mmkv) {
      mmkv.delete(key);
      return;
    }
    if (isServer) return;
    await AsyncStorage.removeItem(key);
  },
  async multiGet(keys: string[]) {
    const mmkv = getMMKVStore();
    if (mmkv) {
      return keys.map((key) => [key, mmkv.getString(key) ?? null] as [string, string | null]);
    }
    if (isServer) return keys.map((key) => [key, null] as [string, string | null]);
    return AsyncStorage.multiGet(keys);
  },
  async multiRemove(keys: string[]) {
    const mmkv = getMMKVStore();
    if (mmkv) {
      for (const key of keys) {
        mmkv.delete(key);
      }
      return;
    }
    if (isServer) return;
    await AsyncStorage.multiRemove(keys);
  },
  async getAllKeys() {
    const mmkv = getMMKVStore();
    if (mmkv) {
      return mmkv.getAllKeys?.() ?? [];
    }
    if (isServer) return [];
    return AsyncStorage.getAllKeys();
  },
  getItemSync(key: string) {
    const mmkv = getMMKVStore();
    if (mmkv) {
      return mmkv.getString(key) ?? null;
    }
    return null;
  },
  getAllKeysSync() {
    const mmkv = getMMKVStore();
    return mmkv?.getAllKeys?.() ?? [];
  },
};

export const setItem = storage.setItem;
export const getItem = storage.getItem;
export const removeItem = storage.removeItem;
