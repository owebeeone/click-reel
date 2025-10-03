/**
 * Storage operations hook
 */

import { useState, useCallback } from "react";
import { useClickReelContext } from "../context/ClickReelContext";
import { ActionType, type StorageAPI, type Reel } from "../../types";
import { getStorageService } from "../../core/storage";

/**
 * Hook for IndexedDB storage operations
 */
export function useStorage(): StorageAPI {
  const { dispatch } = useClickReelContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StorageAPI["error"]>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storage = getStorageService();
      await storage.init();
      const inventory = await storage.loadAllReels();
      dispatch({ type: ActionType.LOAD_INVENTORY, payload: inventory });
      return inventory;
    } catch (err) {
      const errorState = {
        message: "Failed to load inventory",
        timestamp: Date.now(),
        details: err,
      };
      setError(errorState);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const loadReel = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const storage = getStorageService();
      await storage.init();
      return await storage.loadReel(id);
    } catch (err) {
      const errorState = {
        message: "Failed to load reel",
        timestamp: Date.now(),
        details: err,
      };
      setError(errorState);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveReel = useCallback(
    async (reel: Reel) => {
      setLoading(true);
      setError(null);
      try {
        const storage = getStorageService();
        await storage.init();
        const id = await storage.saveReel(reel);
        // Reload inventory
        const inventory = await storage.loadAllReels();
        dispatch({ type: ActionType.LOAD_INVENTORY, payload: inventory });
        return id;
      } catch (err) {
        const errorState = {
          message: "Failed to save reel",
          timestamp: Date.now(),
          details: err,
        };
        setError(errorState);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  const deleteReel = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const storage = getStorageService();
        await storage.init();
        await storage.deleteReel(id);
        dispatch({ type: ActionType.DELETE_REEL, payload: id });
        // Reload inventory
        const inventory = await storage.loadAllReels();
        dispatch({ type: ActionType.LOAD_INVENTORY, payload: inventory });
      } catch (err) {
        const errorState = {
          message: "Failed to delete reel",
          timestamp: Date.now(),
          details: err,
        };
        setError(errorState);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  const getStorageInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storage = getStorageService();
      await storage.init();
      return await storage.getStorageInfo();
    } catch (err) {
      const errorState = {
        message: "Failed to get storage info",
        timestamp: Date.now(),
        details: err,
      };
      setError(errorState);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReel = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Reel, "title" | "description">>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const storage = getStorageService();
        await storage.init();
        await storage.updateReel(id, updates);
      } catch (err) {
        const errorState = {
          message: "Failed to update reel",
          timestamp: Date.now(),
          details: err,
        };
        setError(errorState);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loadInventory,
    loadReel,
    saveReel,
    updateReel,
    deleteReel,
    getStorageInfo,
    loading,
    error,
  };
}
