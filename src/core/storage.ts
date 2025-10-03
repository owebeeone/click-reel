/**
 * IndexedDB storage for reels and frames
 */

import { openDB, type IDBPDatabase } from "idb";
import type { Frame, Reel, ReelSummary, StorageInfo } from "../types";

const DB_NAME = "click-reel-storage";
const DB_VERSION = 1;

// Store names
const REELS_STORE = "reels";
const FRAMES_STORE = "frames";

/**
 * IndexedDB Database Schema:
 * 
 * reels: {
 *   id: string (primary key)
 *   title: string
 *   description?: string
 *   timestamp: number
 *   frameCount: number
 *   duration: number
 *   settings: CaptureOptions
 * }
 * 
 * frames: {
 *   id: string (primary key)
 *   reelId: string (indexed)
 *   image: Blob | string
 *   timestamp: number
 *   order: number
 *   metadata: CaptureMetadata
 * }
 */

/**
 * Storage service for managing reels and frames in IndexedDB
 */
export class StorageService {
  private db: IDBPDatabase | null = null;

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create reels store
        if (!db.objectStoreNames.contains(REELS_STORE)) {
          const reelsStore = db.createObjectStore(REELS_STORE, {
            keyPath: "id",
          });
          reelsStore.createIndex("timestamp", "timestamp");
        }

        // Create frames store
        if (!db.objectStoreNames.contains(FRAMES_STORE)) {
          const framesStore = db.createObjectStore(FRAMES_STORE, {
            keyPath: "id",
          });
          framesStore.createIndex("reelId", "reelId");
          framesStore.createIndex("order", "order");
        }
      },
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Failed to initialize database");
    }
    return this.db;
  }

  /**
   * Save a complete reel with all frames
   */
  async saveReel(reel: Reel): Promise<string> {
    const db = await this.ensureDB();
    const tx = db.transaction([REELS_STORE, FRAMES_STORE], "readwrite");

    try {
      // Save reel metadata
      const reelData = {
        id: reel.id,
        title: reel.title,
        description: reel.description,
        startTime: reel.startTime,
        endTime: reel.endTime,
        frameCount: reel.frames.length,
        duration: reel.metadata.duration,
        settings: reel.settings,
        metadata: reel.metadata,
      };

      await tx.objectStore(REELS_STORE).put(reelData);

      // Save frames
      const framesStore = tx.objectStore(FRAMES_STORE);
      for (const frame of reel.frames) {
        await framesStore.put(frame);
      }

      await tx.done;
      return reel.id;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to save reel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save frames in chunks to handle large recordings
   */
  async saveFrames(frames: Frame[], chunkSize: number = 10): Promise<void> {
    const db = await this.ensureDB();

    for (let i = 0; i < frames.length; i += chunkSize) {
      const chunk = frames.slice(i, i + chunkSize);
      const tx = db.transaction(FRAMES_STORE, "readwrite");

      try {
        for (const frame of chunk) {
          await tx.objectStore(FRAMES_STORE).put(frame);
        }
        await tx.done;
      } catch (error) {
        tx.abort();
        throw new Error(`Failed to save frames chunk: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Load a complete reel with all frames by ID
   */
  async loadReel(id: string): Promise<Reel | null> {
    const db = await this.ensureDB();

    try {
      const reelData = await db.get(REELS_STORE, id);
      if (!reelData) return null;

      const frames = await this.loadFramesByReelId(id);

      return {
        id: reelData.id,
        title: reelData.title,
        description: reelData.description,
        startTime: reelData.startTime,
        endTime: reelData.endTime,
        frames,
        settings: reelData.settings,
        metadata: reelData.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to load reel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load frames for a specific reel
   */
  async loadFramesByReelId(reelId: string): Promise<Frame[]> {
    const db = await this.ensureDB();

    try {
      const index = db.transaction(FRAMES_STORE).objectStore(FRAMES_STORE).index("reelId");
      const frames = await index.getAll(reelId);
      
      // Sort frames by order
      return frames.sort((a, b) => a.order - b.order);
    } catch (error) {
      throw new Error(`Failed to load frames: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load all reels (summaries only, no frames)
   */
  async loadAllReels(): Promise<ReelSummary[]> {
    const db = await this.ensureDB();

    try {
      const reels = await db.getAll(REELS_STORE);
      
      return reels
        .map(reel => ({
          id: reel.id,
          title: reel.title,
          description: reel.description,
          startTime: reel.startTime,
          endTime: reel.endTime,
          frameCount: reel.frameCount,
          estimatedSize: reel.estimatedSize || 0,
        }))
        .sort((a, b) => b.startTime - a.startTime); // Most recent first
    } catch (error) {
      throw new Error(`Failed to load reels: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update reel metadata (title, description)
   */
  async updateReel(id: string, updates: Partial<Pick<Reel, "title" | "description">>): Promise<void> {
    const db = await this.ensureDB();

    try {
      const reel = await db.get(REELS_STORE, id);
      if (!reel) {
        throw new Error(`Reel not found: ${id}`);
      }

      const updatedReel = { ...reel, ...updates };
      await db.put(REELS_STORE, updatedReel);
    } catch (error) {
      throw new Error(`Failed to update reel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a reel and all its frames
   */
  async deleteReel(id: string): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction([REELS_STORE, FRAMES_STORE], "readwrite");

    try {
      // Delete reel
      await tx.objectStore(REELS_STORE).delete(id);

      // Delete all frames for this reel
      const framesStore = tx.objectStore(FRAMES_STORE);
      const index = framesStore.index("reelId");
      const frameKeys = await index.getAllKeys(id);

      for (const key of frameKeys) {
        await framesStore.delete(key);
      }

      await tx.done;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to delete reel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete frames by reel ID
   */
  async deleteFramesByReelId(reelId: string): Promise<void> {
    const db = await this.ensureDB();

    try {
      const tx = db.transaction(FRAMES_STORE, "readwrite");
      const framesStore = tx.objectStore(FRAMES_STORE);
      const index = framesStore.index("reelId");
      const frameKeys = await index.getAllKeys(reelId);

      for (const key of frameKeys) {
        await framesStore.delete(key);
      }

      await tx.done;
    } catch (error) {
      throw new Error(`Failed to delete frames: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get storage information and quota
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const db = await this.ensureDB();

      // Count reels and frames
      const reelsCount = await db.count(REELS_STORE);
      const framesCount = await db.count(FRAMES_STORE);

      // Estimate storage usage
      let estimatedSize = 0;
      
      // Get all frames to estimate size
      const allFrames = await db.getAll(FRAMES_STORE);
      for (const frame of allFrames) {
        if (frame.image instanceof Blob) {
          estimatedSize += frame.image.size;
        } else if (typeof frame.image === "string") {
          // Rough estimate for data URL: base64 is ~1.37x original size
          estimatedSize += Math.floor(frame.image.length * 0.75);
        }
      }

      // Get quota information if available
      let quota = 0;
      let usage = 0;
      
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota || 0;
        usage = estimate.usage || 0;
      }

      return {
        reelsCount,
        framesCount,
        estimatedSize,
        quota,
        usage,
        available: quota - usage,
        percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get storage info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if storage quota is low (> 80% used)
   */
  async isQuotaLow(): Promise<boolean> {
    const info = await this.getStorageInfo();
    return info.percentUsed > 80;
  }

  /**
   * Clean up old reels based on FIFO strategy
   */
  async cleanupOldReels(keepCount: number = 5): Promise<string[]> {
    const summaries = await this.loadAllReels();
    
    if (summaries.length <= keepCount) {
      return [];
    }

    // Sort by startTime (oldest first) and remove excess
    const toDelete = summaries
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, summaries.length - keepCount);

    const deletedIds: string[] = [];

    for (const summary of toDelete) {
      await this.deleteReel(summary.id);
      deletedIds.push(summary.id);
    }

    return deletedIds;
  }

  /**
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction([REELS_STORE, FRAMES_STORE], "readwrite");

    try {
      await tx.objectStore(REELS_STORE).clear();
      await tx.objectStore(FRAMES_STORE).clear();
      await tx.done;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to clear database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let storageInstance: StorageService | null = null;

/**
 * Get the global storage service instance
 */
export function getStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService();
  }
  return storageInstance;
}

/**
 * Reset the storage service instance (useful for testing)
 */
export function resetStorageService(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
}

