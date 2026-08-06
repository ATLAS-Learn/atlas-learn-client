import { PersistOptions, createJSONStorage } from "zustand/middleware";
import { storage } from "@/lib/utils/storage";

export function createPersistStorage<T>(): PersistOptions<T, T>["storage"] {
  return createJSONStorage(() => storage);
}
