/**
 * GIF and APNG encoding services
 */

import { GIFEncoder, quantize, applyPalette } from "gifenc";
import UPNG from "upng-js";
import type { Frame, GIFOptions, APNGOptions } from "../types";
import { extractImageData, resizeImage } from "../utils/image-utils";
import { DEFAULT_GIF_OPTIONS } from "../utils/constants";

/**
 * Progress callback for encoding operations
 */
export type ProgressCallback = (
  progress: number,
  total: number,
  status: string
) => void;

/**
 * Encodes frames into an animated GIF
 */
export async function encodeGIF(
  frames: Frame[],
  options: GIFOptions = {},
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error("Cannot encode GIF: no frames provided");
  }

  onProgress?.(0, frames.length, "Initializing GIF encoder...");

  const config = {
    ...DEFAULT_GIF_OPTIONS,
    ...options,
  };

  const gif = GIFEncoder();

  // Process each frame
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    onProgress?.(
      i,
      frames.length,
      `Processing frame ${i + 1}/${frames.length}...`
    );

    try {
      // Get image data
      const imageData = await getImageDataFromFrame(frame);

      // Calculate delay from timestamps
      const delay =
        i < frames.length - 1 ? frames[i + 1].timestamp - frame.timestamp : 100;
      const delayMs = Math.max(10, Math.min(delay, 10000)); // Clamp between 10ms and 10s

      // Quantize the image to get palette (returns array of RGB arrays)
      const palette = quantize(imageData.data, config.maxColors || 256, {
        format: "rgb565",
      });

      // Apply palette to get indexed bitmap
      const index = applyPalette(imageData.data, palette, "rgb565");

      // Write frame to GIF
      gif.writeFrame(index, imageData.width, imageData.height, {
        palette,
        delay: Math.round(delayMs / 10), // GIF delay is in hundredths of a second
        transparent: false,
        dispose: 2, // Restore to background
      });
    } catch (error) {
      console.error(`Failed to process frame ${i}:`, error);
      throw new Error(
        `Failed to encode frame ${i + 1}/${frames.length}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  onProgress?.(frames.length, frames.length, "Finalizing GIF...");

  // Finish encoding
  gif.finish();

  // Convert to Blob
  const buffer = gif.bytes();
  const blob = new Blob([buffer.buffer as ArrayBuffer], { type: "image/gif" });

  onProgress?.(frames.length, frames.length, "Complete!");

  return blob;
}

/**
 * Encodes frames into an animated PNG (APNG)
 */
export async function encodeAPNG(
  frames: Frame[],
  _options: APNGOptions = {}, // Prefix with _ to indicate intentionally unused
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error("Cannot encode APNG: no frames provided");
  }

  onProgress?.(0, frames.length, "Initializing APNG encoder...");

  // Prepare frame data
  const frameBuffers: ArrayBuffer[] = [];
  const delays: number[] = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    onProgress?.(
      i,
      frames.length,
      `Processing frame ${i + 1}/${frames.length}...`
    );

    // Get image data
    const imageData = await getImageDataFromFrame(frame);

    // Convert ImageData to RGBA buffer
    const buffer = imageData.data.buffer;
    frameBuffers.push(buffer);

    // Calculate delay from timestamps
    const delay =
      i < frames.length - 1 ? frames[i + 1].timestamp - frame.timestamp : 100;
    delays.push(Math.max(10, Math.min(delay, 10000))); // Clamp between 10ms and 10s
  }

  onProgress?.(frames.length, frames.length, "Encoding APNG...");

  // Get dimensions from first frame
  const firstImageData = await getImageDataFromFrame(frames[0]);
  const { width, height } = firstImageData;

  // Encode to APNG
  // UPNG.encode(imgs, w, h, cnum, [dels])
  // imgs: array of RGBA buffers
  // w, h: width and height
  // cnum: color depth (0 = all colors, 256 = 256 colors)
  // dels: array of delays in milliseconds
  const apngBuffer = UPNG.encode(
    frameBuffers,
    width,
    height,
    0, // 0 = use all colors (full color depth)
    delays
  );

  onProgress?.(frames.length, frames.length, "Complete!");

  // Convert to Blob
  const blob = new Blob([apngBuffer], { type: "image/png" });

  return blob;
}

/**
 * Estimates the output size of encoded frames
 */
export function estimateEncodedSize(
  frames: Frame[],
  format: "gif" | "apng",
  options?: GIFOptions | APNGOptions
): number {
  if (frames.length === 0) return 0;

  // Very rough estimation based on format and frame count
  const avgFrameSize = 50000; // ~50KB per frame (conservative estimate)

  if (format === "gif") {
    const gifOptions = options as GIFOptions;
    const qualityFactor = (gifOptions?.quality || 80) / 100;
    const colorFactor = Math.min((gifOptions?.maxColors || 256) / 256, 1);
    return Math.round(
      frames.length * avgFrameSize * qualityFactor * colorFactor * 0.3
    ); // GIF compression factor
  } else {
    const apngOptions = options as APNGOptions;
    const compressionFactor =
      1 - ((apngOptions?.compressionLevel || 6) / 9) * 0.5;
    return Math.round(frames.length * avgFrameSize * compressionFactor * 0.5); // APNG compression factor
  }
}

/**
 * Prepares frames for encoding by resizing if needed
 */
export async function prepareFramesForEncoding(
  frames: Frame[],
  maxWidth?: number,
  maxHeight?: number,
  onProgress?: ProgressCallback
): Promise<Frame[]> {
  if (!maxWidth && !maxHeight) {
    return frames;
  }

  const preparedFrames: Frame[] = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    onProgress?.(
      i,
      frames.length,
      `Resizing frame ${i + 1}/${frames.length}...`
    );

    // Get current image as data URL
    const dataUrl =
      typeof frame.image === "string"
        ? frame.image
        : await blobToDataURL(frame.image);

    // Resize if needed
    const resized = await resizeImage(
      dataUrl,
      maxWidth || Infinity,
      maxHeight || Infinity
    );

    preparedFrames.push({
      ...frame,
      image: resized,
    });
  }

  return preparedFrames;
}

/**
 * Converts a Blob to data URL
 */
async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper to get ImageData from a Frame
 */
async function getImageDataFromFrame(frame: Frame): Promise<ImageData> {
  try {
    const dataUrl =
      typeof frame.image === "string"
        ? frame.image
        : await blobToDataURL(frame.image);

    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      throw new Error(`Invalid image data URL for frame ${frame.id}`);
    }

    const imageData = await extractImageData(dataUrl);

    if (!imageData || !imageData.data || imageData.data.length === 0) {
      throw new Error(
        `Failed to extract ImageData from frame ${frame.id}: ImageData is invalid`
      );
    }

    return imageData;
  } catch (error) {
    console.error(`Error processing frame ${frame.id}:`, error);
    console.error("Frame image type:", typeof frame.image);
    console.error(
      "Frame image preview:",
      typeof frame.image === "string" ? frame.image.substring(0, 100) : "Blob"
    );
    throw error;
  }
}

/**
 * Optimizes frames by removing duplicate consecutive frames
 */
export function optimizeFrames(frames: Frame[]): Frame[] {
  if (frames.length <= 1) return frames;

  const optimized: Frame[] = [frames[0]];

  for (let i = 1; i < frames.length; i++) {
    const current = frames[i];
    const previous = frames[i - 1];

    // Only keep frame if it's different from the previous one
    if (current.image !== previous.image) {
      optimized.push(current);
    }
  }

  return optimized;
}

/**
 * Creates a preview GIF with reduced quality for quick preview
 */
export async function createPreviewGIF(
  frames: Frame[],
  maxFrames: number = 10,
  onProgress?: ProgressCallback
): Promise<Blob> {
  // Sample frames evenly
  const step = Math.max(1, Math.floor(frames.length / maxFrames));
  const sampledFrames = frames
    .filter((_, i) => i % step === 0)
    .slice(0, maxFrames);

  // Encode with lower quality settings
  return encodeGIF(
    sampledFrames,
    {
      quality: 50,
      maxColors: 128,
      dithering: "none",
      fps: 5,
    },
    onProgress
  );
}
