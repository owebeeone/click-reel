/**
 * Tests for IndexedDB storage service
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  StorageService,
  getStorageService,
  resetStorageService,
} from "../../core/storage";
import type { Frame, Reel } from "../../types";
import { nanoid } from "nanoid";

describe("StorageService", () => {
  let storage: StorageService;

  beforeEach(async () => {
    storage = new StorageService();
    await storage.init();
  });

  afterEach(async () => {
    await storage.clearAll();
    storage.close();
  });

  const createMockFrame = (reelId: string, order: number): Frame => ({
    id: nanoid(),
    reelId,
    image: "data:image/png;base64,test",
    timestamp: Date.now() + order * 100,
    order,
    metadata: {
      viewportCoords: { x: 100, y: 100 },
      relativeCoords: { x: 50, y: 50 },
      elementPath: "div.test",
      buttonType: 0,
      viewportSize: { width: 1920, height: 1080 },
      scrollPosition: { x: 0, y: 0 },
      captureType: "pre-click",
    },
  });

  const createMockReel = (frameCount: number = 3): Reel => {
    const id = nanoid();
    const frames = Array.from({ length: frameCount }, (_, i) =>
      createMockFrame(id, i)
    );

    return {
      id,
      title: "Test Reel",
      description: "Test description",
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      frames,
      settings: {
        markerSize: 20,
        markerColor: "#ff0000",
        exportFormat: "gif",
        postClickDelay: 100,
        postClickInterval: 50,
        maxCaptureDuration: 5000,
        scale: 1,
        obfuscationEnabled: false,
      },
      metadata: {
        userAgent: "test",
        duration: 1000,
        clickCount: frameCount,
        viewportSize: { width: 1920, height: 1080 },
      },
    };
  };

  describe("initialization", () => {
    it("should initialize database", async () => {
      const newStorage = new StorageService();
      await expect(newStorage.init()).resolves.not.toThrow();
      newStorage.close();
    });

    it("should not reinitialize if already initialized", async () => {
      await storage.init(); // Already initialized in beforeEach
      await expect(storage.init()).resolves.not.toThrow();
    });
  });

  describe("saveReel", () => {
    it("should save a reel with frames", async () => {
      const reel = createMockReel(3);
      const id = await storage.saveReel(reel);

      expect(id).toBe(reel.id);

      const loaded = await storage.loadReel(id);
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(reel.id);
      expect(loaded?.frames).toHaveLength(3);
    });

    it("should save reel metadata correctly", async () => {
      const reel = createMockReel(5);
      await storage.saveReel(reel);

      const loaded = await storage.loadReel(reel.id);
      expect(loaded?.title).toBe(reel.title);
      expect(loaded?.description).toBe(reel.description);
      expect(loaded?.frames).toHaveLength(5);
    });

    it("should update existing reel", async () => {
      const reel = createMockReel(2);
      await storage.saveReel(reel);

      // Update and save again
      const updatedReel = { ...reel, title: "Updated Title" };
      await storage.saveReel(updatedReel);

      const loaded = await storage.loadReel(reel.id);
      expect(loaded?.title).toBe("Updated Title");
    });
  });

  describe("saveFrames", () => {
    it("should save frames in chunks", async () => {
      const reelId = nanoid();
      const frames = Array.from({ length: 25 }, (_, i) =>
        createMockFrame(reelId, i)
      );

      await storage.saveFrames(frames, 10);

      const loaded = await storage.loadFramesByReelId(reelId);
      expect(loaded).toHaveLength(25);
    });

    it("should maintain frame order", async () => {
      const reelId = nanoid();
      const frames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(reelId, i)
      );

      await storage.saveFrames(frames, 5);

      const loaded = await storage.loadFramesByReelId(reelId);
      expect(loaded.map((f) => f.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe("loadReel", () => {
    it("should load a complete reel", async () => {
      const reel = createMockReel(4);
      await storage.saveReel(reel);

      const loaded = await storage.loadReel(reel.id);
      expect(loaded).toBeDefined();
      expect(loaded?.frames).toHaveLength(4);
      expect(loaded?.frames[0].order).toBe(0);
      expect(loaded?.frames[3].order).toBe(3);
    });

    it("should return null for non-existent reel", async () => {
      const loaded = await storage.loadReel("non-existent");
      expect(loaded).toBeNull();
    });
  });

  describe("loadAllReels", () => {
    it("should load all reels without frames", async () => {
      const reel1 = createMockReel(3);
      const reel2 = createMockReel(5);

      await storage.saveReel(reel1);
      await storage.saveReel(reel2);

      const summaries = await storage.loadAllReels();
      expect(summaries).toHaveLength(2);
      expect(summaries[0].frameCount).toBeDefined();
      expect(summaries[1].frameCount).toBeDefined();
    });

    it("should sort reels by startTime (most recent first)", async () => {
      const reel1 = { ...createMockReel(2), startTime: 1000 };
      const reel2 = { ...createMockReel(2), startTime: 2000 };
      const reel3 = { ...createMockReel(2), startTime: 1500 };

      await storage.saveReel(reel1);
      await storage.saveReel(reel2);
      await storage.saveReel(reel3);

      const summaries = await storage.loadAllReels();
      expect(summaries[0].startTime).toBe(2000);
      expect(summaries[1].startTime).toBe(1500);
      expect(summaries[2].startTime).toBe(1000);
    });

    it("should return empty array if no reels", async () => {
      const summaries = await storage.loadAllReels();
      expect(summaries).toEqual([]);
    });
  });

  describe("updateReel", () => {
    it("should update reel title", async () => {
      const reel = createMockReel(2);
      await storage.saveReel(reel);

      await storage.updateReel(reel.id, { title: "New Title" });

      const loaded = await storage.loadReel(reel.id);
      expect(loaded?.title).toBe("New Title");
    });

    it("should update reel description", async () => {
      const reel = createMockReel(2);
      await storage.saveReel(reel);

      await storage.updateReel(reel.id, { description: "New Description" });

      const loaded = await storage.loadReel(reel.id);
      expect(loaded?.description).toBe("New Description");
    });

    it("should throw error for non-existent reel", async () => {
      await expect(
        storage.updateReel("non-existent", { title: "Test" })
      ).rejects.toThrow("Reel not found");
    });
  });

  describe("deleteReel", () => {
    it("should delete reel and all frames", async () => {
      const reel = createMockReel(5);
      await storage.saveReel(reel);

      await storage.deleteReel(reel.id);

      const loaded = await storage.loadReel(reel.id);
      expect(loaded).toBeNull();

      const frames = await storage.loadFramesByReelId(reel.id);
      expect(frames).toHaveLength(0);
    });

    it("should not affect other reels", async () => {
      const reel1 = createMockReel(3);
      const reel2 = createMockReel(3);

      await storage.saveReel(reel1);
      await storage.saveReel(reel2);

      await storage.deleteReel(reel1.id);

      const loaded = await storage.loadReel(reel2.id);
      expect(loaded).toBeDefined();
      expect(loaded?.frames).toHaveLength(3);
    });
  });

  describe("deleteFramesByReelId", () => {
    it("should delete all frames for a reel", async () => {
      const reelId = nanoid();
      const frames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(reelId, i)
      );

      await storage.saveFrames(frames);
      await storage.deleteFramesByReelId(reelId);

      const loaded = await storage.loadFramesByReelId(reelId);
      expect(loaded).toHaveLength(0);
    });
  });

  describe("getStorageInfo", () => {
    it("should return storage information", async () => {
      const reel = createMockReel(5);
      await storage.saveReel(reel);

      const info = await storage.getStorageInfo();
      expect(info).toBeDefined();
      expect(info.reelsCount).toBe(1);
      expect(info.framesCount).toBe(5);
      expect(info.estimatedSize).toBeGreaterThan(0);
    });

    it("should return zero counts for empty storage", async () => {
      const info = await storage.getStorageInfo();
      expect(info.reelsCount).toBe(0);
      expect(info.framesCount).toBe(0);
      expect(info.estimatedSize).toBe(0);
    });
  });

  describe("isQuotaLow", () => {
    it.skip("should return false for low usage", async () => {
      // Skipped: requires browser storage API
      const isLow = await storage.isQuotaLow();
      expect(isLow).toBe(false);
    });

    it.skip("should return true for high usage", async () => {
      // Skipped: requires browser storage API
      const isLow = await storage.isQuotaLow();
      expect(isLow).toBe(true);
    });
  });

  describe("cleanupOldReels", () => {
    it("should keep specified number of reels", async () => {
      const reels = Array.from({ length: 10 }, (_, i) => ({
        ...createMockReel(2),
        timestamp: 1000 + i * 100,
      }));

      for (const reel of reels) {
        await storage.saveReel(reel);
      }

      const deleted = await storage.cleanupOldReels(5);
      expect(deleted).toHaveLength(5);

      const remaining = await storage.loadAllReels();
      expect(remaining).toHaveLength(5);
    });

    it("should delete oldest reels first", async () => {
      const reel1 = { ...createMockReel(2), startTime: 1000 };
      const reel2 = { ...createMockReel(2), startTime: 2000 };
      const reel3 = { ...createMockReel(2), startTime: 3000 };

      await storage.saveReel(reel1);
      await storage.saveReel(reel2);
      await storage.saveReel(reel3);

      const deleted = await storage.cleanupOldReels(2);
      expect(deleted).toContain(reel1.id);

      const remaining = await storage.loadAllReels();
      expect(remaining.map((r) => r.id)).toEqual(
        expect.arrayContaining([reel2.id, reel3.id])
      );
    });

    it("should not delete if count is <= keepCount", async () => {
      const reel = createMockReel(2);
      await storage.saveReel(reel);

      const deleted = await storage.cleanupOldReels(5);
      expect(deleted).toHaveLength(0);

      const remaining = await storage.loadAllReels();
      expect(remaining).toHaveLength(1);
    });
  });

  describe("clearAll", () => {
    it("should clear all reels and frames", async () => {
      const reel1 = createMockReel(3);
      const reel2 = createMockReel(5);

      await storage.saveReel(reel1);
      await storage.saveReel(reel2);

      await storage.clearAll();

      const summaries = await storage.loadAllReels();
      expect(summaries).toHaveLength(0);

      const info = await storage.getStorageInfo();
      expect(info.framesCount).toBe(0);
    });
  });

  describe("singleton", () => {
    it("should return same instance", () => {
      const instance1 = getStorageService();
      const instance2 = getStorageService();
      expect(instance1).toBe(instance2);
    });

    it("should reset instance", () => {
      const instance1 = getStorageService();
      resetStorageService();
      const instance2 = getStorageService();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Test loading a non-existent reel returns null instead of throwing
      const result = await storage.loadReel("non-existent-id");
      expect(result).toBeNull();
    });

    it("should handle update errors for non-existent reels", async () => {
      await expect(
        storage.updateReel("non-existent-id", { title: "Test" })
      ).rejects.toThrow("Reel not found");
    });
  });
});

