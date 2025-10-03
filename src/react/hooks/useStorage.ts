/**
 * Storage operations hook
 * @placeholder - Will be fully implemented in Phase 6
 */

import type { StorageAPI } from "../../types";

/**
 * Hook for IndexedDB storage operations
 */
export function useStorage(): StorageAPI {
  return {
    loadInventory: async () => [],
    loadReel: async () => null,
    saveReel: async () => "placeholder-id",
    deleteReel: async () => {
      console.log("Delete reel (placeholder)");
    },
    getStorageInfo: async () => ({
      quota: 0,
      usage: 0,
      available: 0,
      percentUsed: 0,
    }),
    loading: false,
    error: null,
  };
}
