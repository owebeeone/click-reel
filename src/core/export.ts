/**
 * Export and download services for reels
 */

import JSZip from "jszip";
import type { Reel } from "../types";
import { encodeGIF, encodeAPNG, type ProgressCallback } from "./encoder";
import {
  generateReelMetadata,
  exportMetadataJSON,
  generateFilename,
} from "./metadata";
import { DEFAULT_GIF_OPTIONS, DEFAULT_APNG_OPTIONS } from "../utils/constants";
import { dataURLToBlob } from "../utils/image-utils";

/**
 * Export format options
 */
export type ExportFormat = "gif" | "apng" | "zip";

/**
 * Export options
 */
export interface ExportOptions {
  /** Output format */
  format: ExportFormat;
  /** Include metadata JSON in export */
  includeMetadata?: boolean;
  /** Include HTML snapshot */
  includeHTML?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
  /** GIF encoding options (if format is 'gif' or 'zip') */
  gifOptions?: Parameters<typeof encodeGIF>[1];
  /** APNG encoding options (if format is 'apng' or 'zip') */
  apngOptions?: Parameters<typeof encodeAPNG>[1];
  /** Progress callback */
  onProgress?: ProgressCallback;
}

/**
 * Result of export operation
 */
export interface ExportResult {
  /** Blob containing the exported data */
  blob: Blob;
  /** Filename with extension */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** Size in bytes */
  size: number;
}

/**
 * Export a reel to the specified format
 */
export async function exportReel(
  reel: Reel,
  options: ExportOptions
): Promise<ExportResult> {
  const {
    format,
    includeMetadata = true,
    includeHTML = false,
    filename,
    gifOptions = DEFAULT_GIF_OPTIONS,
    apngOptions = DEFAULT_APNG_OPTIONS,
    onProgress,
  } = options;

  const baseFilename =
    filename ||
    generateFilename(reel, "zip").replace(/\.(gif|png|zip|json)$/, "");

  switch (format) {
    case "gif":
      return exportGIF(reel, baseFilename, gifOptions, onProgress);
    case "apng":
      return exportAPNG(reel, baseFilename, apngOptions, onProgress);
    case "zip":
      return exportZIP(
        reel,
        baseFilename,
        { includeMetadata, includeHTML, gifOptions, apngOptions },
        onProgress
      );
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export reel as GIF
 */
async function exportGIF(
  reel: Reel,
  filename: string,
  options: Parameters<typeof encodeGIF>[1],
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  onProgress?.(0, 1, "Encoding GIF...");

  const blob = await encodeGIF(reel.frames, options, onProgress);

  return {
    blob,
    filename: `${filename}.gif`,
    mimeType: "image/gif",
    size: blob.size,
  };
}

/**
 * Export reel as APNG
 */
async function exportAPNG(
  reel: Reel,
  filename: string,
  options: Parameters<typeof encodeAPNG>[1],
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  onProgress?.(0, 1, "Encoding APNG...");

  const blob = await encodeAPNG(reel.frames, options, onProgress);

  return {
    blob,
    filename: `${filename}.png`,
    mimeType: "image/png",
    size: blob.size,
  };
}

/**
 * Export reel as ZIP bundle with GIF/APNG, individual frames, and metadata
 */
async function exportZIP(
  reel: Reel,
  filename: string,
  options: {
    includeMetadata: boolean;
    includeHTML: boolean;
    gifOptions: Parameters<typeof encodeGIF>[1];
    apngOptions: Parameters<typeof encodeAPNG>[1];
  },
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const zip = new JSZip();

  // Calculate total steps for progress reporting
  const frameCount = reel.frames.length;
  const totalSteps =
    3 +
    frameCount +
    (options.includeMetadata ? 1 : 0) +
    (options.includeHTML ? 1 : 0);
  let currentStep = 0;

  // Add GIF
  onProgress?.(currentStep++, totalSteps, "Encoding GIF...");
  const gifBlob = await encodeGIF(reel.frames, options.gifOptions);
  zip.file(`${filename}.gif`, gifBlob);

  // Add APNG
  onProgress?.(currentStep++, totalSteps, "Encoding APNG...");
  const apngBlob = await encodeAPNG(reel.frames, options.apngOptions);
  zip.file(`${filename}.png`, apngBlob);

  // Add individual frames as PNGs and GIFs
  onProgress?.(
    currentStep,
    totalSteps,
    `Adding ${frameCount} individual frames...`
  );
  const pngsFolder = zip.folder("pngs");
  const gifsFolder = zip.folder("gifs");

  if (pngsFolder && gifsFolder) {
    for (let i = 0; i < reel.frames.length; i++) {
      const frame = reel.frames[i];
      const paddedNum = String(i + 1).padStart(3, "0");

      // Add PNG frame
      const pngBlob =
        typeof frame.image === "string"
          ? dataURLToBlob(frame.image)
          : frame.image;
      pngsFolder.file(`frame-${paddedNum}.png`, pngBlob);

      // Add GIF frame (encode single frame as GIF)
      const gifBlob = await encodeGIF([frame], options.gifOptions);
      gifsFolder.file(`frame-${paddedNum}.gif`, gifBlob);

      // Update progress for each frame
      onProgress?.(
        currentStep + i + 1,
        totalSteps,
        `Adding frame ${i + 1}/${frameCount}...`
      );
    }
  }
  currentStep += frameCount;

  // Add metadata JSON
  if (options.includeMetadata) {
    onProgress?.(currentStep++, totalSteps, "Generating metadata...");
    const metadataJSON = exportMetadataJSON(reel);
    zip.file(`${filename}-metadata.json`, metadataJSON);
  }

  // Add HTML snapshot (if available and requested)
  if (options.includeHTML && reel.frames[0]?.metadata.htmlSnapshot) {
    onProgress?.(currentStep++, totalSteps, "Adding HTML snapshot...");
    const htmlContent = generateHTMLViewer(reel);
    zip.file(`${filename}-viewer.html`, htmlContent);
  }

  // Generate ZIP
  onProgress?.(currentStep++, totalSteps, "Generating ZIP...");
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    blob: zipBlob,
    filename: `${filename}.zip`,
    mimeType: "application/zip",
    size: zipBlob.size,
  };
}

/**
 * Download a blob to the user's device
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Clean up the object URL after a short delay to ensure download started
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}

/**
 * Download export result
 */
export function downloadExport(result: ExportResult): void {
  downloadBlob(result.blob, result.filename);
}

/**
 * Export and download in one step
 */
export async function exportAndDownload(
  reel: Reel,
  options: ExportOptions
): Promise<ExportResult> {
  const result = await exportReel(reel, options);
  downloadExport(result);
  return result;
}

/**
 * Generate HTML viewer for reel (for ZIP bundle)
 */
function generateHTMLViewer(reel: Reel): string {
  const metadata = generateReelMetadata(reel);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reel.title} - Click Reel Viewer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f5;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 2rem;
    }
    h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    .description {
      color: #666;
      margin-bottom: 2rem;
    }
    .metadata {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }
    .metadata h2 {
      color: #555;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    .metadata dl {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 0.5rem;
    }
    .metadata dt {
      font-weight: 600;
      color: #666;
    }
    .metadata dd {
      color: #444;
    }
    .media-container {
      margin-top: 2rem;
    }
    .media-container img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .tab {
      padding: 0.5rem 1rem;
      background: #e0e0e0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .tab.active {
      background: #007bff;
      color: white;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${reel.title}</h1>
    <p class="description">${reel.description || "No description provided"}</p>

    <div class="metadata">
      <h2>Recording Information</h2>
      <dl>
        <dt>Date:</dt>
        <dd>${new Date(reel.startTime).toLocaleString()}</dd>
        
        <dt>Duration:</dt>
        <dd>${(metadata.duration / 1000).toFixed(2)}s</dd>
        
        <dt>Frames:</dt>
        <dd>${reel.frames.length}</dd>
        
        <dt>Clicks:</dt>
        <dd>${metadata.clickCount}</dd>
        
        <dt>Browser:</dt>
        <dd>${metadata.userAgent}</dd>
        
        <dt>Viewport:</dt>
        <dd>${metadata.viewportSize.width}x${metadata.viewportSize.height}</dd>
        
        ${metadata.url ? `<dt>URL:</dt><dd>${metadata.url}</dd>` : ""}
      </dl>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('gif')">GIF</button>
      <button class="tab" onclick="showTab('apng')">APNG</button>
    </div>

    <div id="gif-content" class="tab-content active media-container">
      <img src="${reel.title}.gif" alt="${reel.title} GIF">
    </div>

    <div id="apng-content" class="tab-content media-container">
      <img src="${reel.title}.png" alt="${reel.title} APNG">
    </div>
  </div>

  <script>
    function showTab(tab) {
      // Update buttons
      document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');

      // Update content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tab + '-content').classList.add('active');
    }
  </script>
</body>
</html>`;
}

/**
 * Create a shareable link from a reel (base64 encoded)
 */
export async function createShareableLink(
  reel: Reel,
  format: "gif" | "apng" = "gif"
): Promise<string> {
  const blob =
    format === "gif"
      ? await encodeGIF(reel.frames, DEFAULT_GIF_OPTIONS)
      : await encodeAPNG(reel.frames, DEFAULT_APNG_OPTIONS);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to create data URL"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Estimate export size before generating
 */
export function estimateExportSize(
  reel: Reel,
  format: ExportFormat,
  includeMetadata: boolean = true
): number {
  let size = 0;

  if (format === "gif" || format === "zip") {
    // Rough GIF estimation: ~30KB per frame
    size += reel.frames.length * 30000;
  }

  if (format === "apng" || format === "zip") {
    // Rough APNG estimation: ~50KB per frame
    size += reel.frames.length * 50000;
  }

  if (includeMetadata && format === "zip") {
    // Metadata JSON: ~5KB
    size += 5000;
  }

  return Math.round(size);
}
