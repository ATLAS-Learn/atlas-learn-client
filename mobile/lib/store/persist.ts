import { PersistOptions, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function createPersistStorage<T>(): PersistOptions<T, T>["storage"] {
  return createJSONStorage(() => AsyncStorage);
}
