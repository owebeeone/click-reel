/**
 * Tests for encoding services
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  encodeGIF,
  encodeAPNG,
  estimateEncodedSize,
  prepareFramesForEncoding,
  optimizeFrames,
  createPreviewGIF,
} from "../../core/encoder";
import type { Frame } from "../../types";

// Mock gifenc
vi.mock("gifenc", () => ({
  GIFEncoder: () => {
    const frames: unknown[] = [];
    return {
      writeFrame: (
        index: unknown,
        width: number,
        height: number,
        options: unknown
      ) => {
        frames.push({ index, width, height, options });
      },
      finish: () => {},
      bytes: () => new Uint8Array([0x47, 0x49, 0x46]), // "GIF" header
    };
  },
  quantize: (_data: Uint8ClampedArray, maxColors: number) => ({
    colors: new Uint8Array(maxColors * 3),
    palette: new Uint8Array(256),
  }),
  applyPalette: () => new Uint8Array(100),
}));

// Mock upng-js
vi.mock("upng-js", () => ({
  default: {
    encode: () => new ArrayBuffer(1000),
  },
}));

describe("encoder", () => {
  let mockFrames: Frame[];

  beforeEach(() => {
    // Create mock frames with simple data URLs
    const dataUrl1 = "data:image/png;base64,iVBORw0KGgo=";
    const dataUrl2 = "data:image/png;base64,iVBORw0KGgoAAAA="; // Different

    mockFrames = [
      {
        id: "frame-1",
        reelId: "reel-1",
        image: dataUrl1,
        timestamp: 1000,
        order: 0,
        metadata: {
          viewportCoords: { x: 0, y: 0 },
          relativeCoords: { x: 0, y: 0 },
          elementPath: "test",
          buttonType: 0,
          viewportSize: { width: 100, height: 100 },
          scrollPosition: { x: 0, y: 0 },
          captureType: "pre-click",
        },
      },
      {
        id: "frame-2",
        reelId: "reel-1",
        image: dataUrl2,
        timestamp: 1100,
        order: 1,
        metadata: {
          viewportCoords: { x: 0, y: 0 },
          relativeCoords: { x: 0, y: 0 },
          elementPath: "test",
          buttonType: 0,
          viewportSize: { width: 100, height: 100 },
          scrollPosition: { x: 0, y: 0 },
          captureType: "post-click",
        },
      },
    ];
  });

  describe("encodeGIF", () => {
    it.skip("should encode frames to GIF blob", async () => {
      // Skipped: requires browser canvas/image APIs not available in jsdom
      const blob = await encodeGIF(mockFrames);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("image/gif");
    });

    it("should throw error if no frames provided", async () => {
      await expect(encodeGIF([])).rejects.toThrow(
        "Cannot encode GIF: no frames provided"
      );
    });

    it.skip("should call progress callback with updates", async () => {
      // Skipped: requires browser canvas/image APIs
      const onProgress = vi.fn();
      await encodeGIF(mockFrames, {}, onProgress);
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe("encodeAPNG", () => {
    it.skip("should encode frames to APNG blob", async () => {
      // Skipped: requires browser canvas/image APIs not available in jsdom
      const blob = await encodeAPNG(mockFrames);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("image/png");
    });

    it("should throw error if no frames provided", async () => {
      await expect(encodeAPNG([])).rejects.toThrow(
        "Cannot encode APNG: no frames provided"
      );
    });
  });

  describe("estimateEncodedSize", () => {
    it("should estimate GIF size", () => {
      const size = estimateEncodedSize(mockFrames, "gif");

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("should estimate APNG size", () => {
      const size = estimateEncodedSize(mockFrames, "apng");

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("should return 0 for empty frames", () => {
      const size = estimateEncodedSize([], "gif");

      expect(size).toBe(0);
    });

    it("should account for quality settings in GIF", () => {
      const highQuality = estimateEncodedSize(mockFrames, "gif", {
        quality: 100,
      });
      const lowQuality = estimateEncodedSize(mockFrames, "gif", {
        quality: 50,
      });

      expect(highQuality).toBeGreaterThan(lowQuality);
    });

    it("should account for compression level in APNG", () => {
      const lowCompression = estimateEncodedSize(mockFrames, "apng", {
        compressionLevel: 0,
      });
      const highCompression = estimateEncodedSize(mockFrames, "apng", {
        compressionLevel: 9,
      });

      expect(lowCompression).toBeGreaterThan(highCompression);
    });
  });

  describe("prepareFramesForEncoding", () => {
    it("should return frames unchanged if no max dimensions", async () => {
      const prepared = await prepareFramesForEncoding(mockFrames);

      expect(prepared).toHaveLength(mockFrames.length);
      expect(prepared[0].image).toBe(mockFrames[0].image);
    });

    it.skip("should resize frames if max dimensions provided", async () => {
      // Skipped: requires browser canvas/image APIs
      const prepared = await prepareFramesForEncoding(mockFrames, 50, 50);
      expect(prepared).toHaveLength(mockFrames.length);
    });
  });

  describe("optimizeFrames", () => {
    it("should remove duplicate consecutive frames", () => {
      const sameImage = "data:image/png;base64,same";
      const framesWithDuplicates = [
        { ...mockFrames[0], image: sameImage },
        { ...mockFrames[0], id: "dup-1", image: sameImage }, // duplicate
        { ...mockFrames[1], image: "data:image/png;base64,different" },
        {
          ...mockFrames[1],
          id: "dup-2",
          image: "data:image/png;base64,different",
        }, // duplicate
      ];

      const optimized = optimizeFrames(framesWithDuplicates);

      expect(optimized).toHaveLength(2);
    });

    it("should keep all frames if none are duplicates", () => {
      const optimized = optimizeFrames(mockFrames);

      expect(optimized).toHaveLength(mockFrames.length);
    });

    it("should handle empty array", () => {
      const optimized = optimizeFrames([]);

      expect(optimized).toHaveLength(0);
    });

    it("should handle single frame", () => {
      const optimized = optimizeFrames([mockFrames[0]]);

      expect(optimized).toHaveLength(1);
    });
  });

  describe("createPreviewGIF", () => {
    it.skip("should create a preview GIF with reduced frames", async () => {
      // Skipped: requires browser canvas/image APIs
      const manyFrames = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockFrames[0],
          id: `frame-${i}`,
          order: i,
        }));

      const blob = await createPreviewGIF(manyFrames, 5);
      expect(blob).toBeInstanceOf(Blob);
    });
  });
});
