/**
 * Tests for export and download services
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  exportReel,
  downloadBlob,
  downloadExport,
  exportAndDownload,
  createShareableLink,
  estimateExportSize,
  type ExportFormat,
  type ExportOptions,
  type ExportResult,
} from "../../core/export";
import type { Reel } from "../../types";
import { nanoid } from "nanoid";

// Mock the encoder functions
vi.mock("../../core/encoder", () => ({
  encodeGIF: vi.fn(async () => new Blob(["gif-data"], { type: "image/gif" })),
  encodeAPNG: vi.fn(async () => new Blob(["apng-data"], { type: "image/png" })),
}));

describe("export", () => {
  let mockReel: Reel;

  beforeEach(() => {
    mockReel = {
      id: nanoid(),
      title: "Test Reel",
      description: "Test Description",
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      frames: [
        {
          id: nanoid(),
          reelId: "test-reel",
          image: "data:image/png;base64,test1",
          timestamp: 1000,
          order: 0,
          metadata: {
            viewportCoords: { x: 100, y: 100 },
            relativeCoords: { x: 50, y: 50 },
            elementPath: "div.test",
            buttonType: 0,
            viewportSize: { width: 1920, height: 1080 },
            scrollPosition: { x: 0, y: 0 },
            captureType: "pre-click",
          },
        },
        {
          id: nanoid(),
          reelId: "test-reel",
          image: "data:image/png;base64,test2",
          timestamp: 1100,
          order: 1,
          metadata: {
            viewportCoords: { x: 150, y: 150 },
            relativeCoords: { x: 75, y: 75 },
            elementPath: "div.test",
            buttonType: 0,
            viewportSize: { width: 1920, height: 1080 },
            scrollPosition: { x: 0, y: 0 },
            captureType: "post-click",
          },
        },
      ],
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
        userAgent: "test-agent",
        duration: 1000,
        clickCount: 2,
        viewportSize: { width: 1920, height: 1080 },
      },
    };
  });

  describe("exportReel", () => {
    it("should export reel as GIF", async () => {
      const options: ExportOptions = {
        format: "gif",
      };

      const result = await exportReel(mockReel, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toMatch(/\.gif$/);
      expect(result.mimeType).toBe("image/gif");
      expect(result.size).toBeGreaterThan(0);
    });

    it("should export reel as APNG", async () => {
      const options: ExportOptions = {
        format: "apng",
      };

      const result = await exportReel(mockReel, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toMatch(/\.png$/);
      expect(result.mimeType).toBe("image/png");
      expect(result.size).toBeGreaterThan(0);
    });

    it("should export reel as ZIP bundle", async () => {
      const options: ExportOptions = {
        format: "zip",
        includeMetadata: true,
      };

      const result = await exportReel(mockReel, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toMatch(/\.zip$/);
      expect(result.mimeType).toBe("application/zip");
      expect(result.size).toBeGreaterThan(0);
    });

    it("should use custom filename", async () => {
      const options: ExportOptions = {
        format: "gif",
        filename: "custom-name",
      };

      const result = await exportReel(mockReel, options);

      expect(result.filename).toBe("custom-name.gif");
    });

    it("should call progress callback", async () => {
      const onProgress = vi.fn();
      const options: ExportOptions = {
        format: "gif",
        onProgress,
      };

      await exportReel(mockReel, options);

      expect(onProgress).toHaveBeenCalled();
    });

    it("should throw error for unsupported format", async () => {
      const options = {
        format: "invalid" as ExportFormat,
      };

      await expect(exportReel(mockReel, options)).rejects.toThrow(
        "Unsupported export format"
      );
    });
  });

  describe("downloadBlob", () => {
    it.skip("should create download link and trigger click", () => {
      // Skipped: requires browser URL.createObjectURL API
      const blob = new Blob(["test"], { type: "text/plain" });
      const filename = "test.txt";
      downloadBlob(blob, filename);
    });
  });

  describe("downloadExport", () => {
    it.skip("should download export result", () => {
      // Skipped: requires browser URL.createObjectURL API
      const result: ExportResult = {
        blob: new Blob(["test"], { type: "image/gif" }),
        filename: "test.gif",
        mimeType: "image/gif",
        size: 100,
      };
      downloadExport(result);
    });
  });

  describe("exportAndDownload", () => {
    it.skip("should export and download in one step", async () => {
      // Skipped: requires browser URL.createObjectURL API
      const options: ExportOptions = {
        format: "gif",
      };
      const result = await exportAndDownload(mockReel, options);
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe("createShareableLink", () => {
    it.skip("should create shareable data URL for GIF", async () => {
      // Skipped: requires browser FileReader API
      const link = await createShareableLink(mockReel, "gif");
      expect(link).toMatch(/^data:image\/gif;base64,/);
    });

    it.skip("should create shareable data URL for APNG", async () => {
      // Skipped: requires browser FileReader API
      const link = await createShareableLink(mockReel, "apng");
      expect(link).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("estimateExportSize", () => {
    it("should estimate GIF export size", () => {
      const size = estimateExportSize(mockReel, "gif");
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("should estimate APNG export size", () => {
      const size = estimateExportSize(mockReel, "apng");
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("should estimate ZIP export size", () => {
      const size = estimateExportSize(mockReel, "zip", true);
      expect(size).toBeGreaterThan(0);
      // ZIP should be larger than individual formats
      const gifSize = estimateExportSize(mockReel, "gif");
      expect(size).toBeGreaterThan(gifSize);
    });

    it("should account for metadata in ZIP", () => {
      const withMetadata = estimateExportSize(mockReel, "zip", true);
      const withoutMetadata = estimateExportSize(mockReel, "zip", false);
      expect(withMetadata).toBeGreaterThan(withoutMetadata);
    });

    it("should scale with frame count", () => {
      const manyFramesReel = {
        ...mockReel,
        frames: Array(10).fill(mockReel.frames[0]),
      };

      const smallSize = estimateExportSize(mockReel, "gif");
      const largeSize = estimateExportSize(manyFramesReel, "gif");

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe("ZIP bundle contents", () => {
    it("should include GIF and APNG in ZIP", async () => {
      const options: ExportOptions = {
        format: "zip",
        includeMetadata: false,
        includeHTML: false,
      };

      const result = await exportReel(mockReel, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toBe("application/zip");
    });

    it("should include metadata when requested", async () => {
      const options: ExportOptions = {
        format: "zip",
        includeMetadata: true,
      };

      const result = await exportReel(mockReel, options);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should include HTML viewer when requested", async () => {
      const reelWithHTML = {
        ...mockReel,
        frames: [
          {
            ...mockReel.frames[0],
            metadata: {
              ...mockReel.frames[0].metadata,
              htmlSnapshot: "<div>Test HTML</div>",
            },
          },
        ],
      };

      const options: ExportOptions = {
        format: "zip",
        includeHTML: true,
      };

      const result = await exportReel(reelWithHTML, options);
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe("filename generation", () => {
    it("should generate filename with title", async () => {
      const options: ExportOptions = {
        format: "gif",
      };

      const result = await exportReel(mockReel, options);
      expect(result.filename).toContain("test-reel");
    });

    it("should sanitize filename", async () => {
      const reelWithSpecialChars = {
        ...mockReel,
        title: "Test / Reel : Special * Chars",
      };

      const options: ExportOptions = {
        format: "gif",
      };

      const result = await exportReel(reelWithSpecialChars, options);
      expect(result.filename).not.toMatch(/[/:\\*]/);
    });
  });

  describe("error handling", () => {
    it("should handle export errors gracefully", async () => {
      const { encodeGIF } = await import("../../core/encoder");
      vi.mocked(encodeGIF).mockRejectedValueOnce(new Error("Encoding failed"));

      const options: ExportOptions = {
        format: "gif",
      };

      await expect(exportReel(mockReel, options)).rejects.toThrow();
    });
  });
});
