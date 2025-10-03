/**
 * Default constants and configuration values
 */

import type {
  UserPreferences,
  MarkerStyle,
  GIFOptions,
  APNGOptions,
} from "../types";

/**
 * Default marker style configuration
 */
export const DEFAULT_MARKER_STYLE: Required<MarkerStyle> = {
  size: 50,
  color: "#ff0000",
  opacity: 0.5,
  borderWidth: 2,
  borderColor: "#ffffff",
  animationDuration: 300,
};

/**
 * Default GIF encoding options
 */
export const DEFAULT_GIF_OPTIONS: Required<GIFOptions> = {
  fps: 10,
  quality: 80,
  dithering: "floyd-steinberg",
  maxColors: 256,
  loop: true,
};

/**
 * Default APNG encoding options
 */
export const DEFAULT_APNG_OPTIONS: Required<APNGOptions> = {
  compressionLevel: 6,
  loop: true,
};

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  markerSize: 50,
  markerColor: "#ff0000",
  exportFormat: "gif",
  postClickDelay: 500,
  postClickInterval: 100,
  maxCaptureDuration: 4000,
  scale: 2,
  maxWidth: 1920,
  maxHeight: 1080,
  obfuscationEnabled: false,
  keyboardShortcuts: {
    toggleRecorder: "ctrl+shift+r",
    toggleObfuscation: "ctrl+shift+o",
    armCapture: "ctrl+shift+a",
    stopRecording: "ctrl+shift+s",
    addFrame: "ctrl+shift+f",
  },
};

/**
 * Default post-click capture delays (in ms)
 */
export const DEFAULT_POST_DELAYS = [500, 600, 700, 800, 1000, 1200, 1500, 2000];

/**
 * Maximum number of frames to prevent browser freeze
 */
export const MAX_FRAME_COUNT = 100;

/**
 * IndexedDB database name
 */
export const DB_NAME = "click-reel-storage";

/**
 * IndexedDB version
 */
export const DB_VERSION = 1;

/**
 * Object store names
 */
export const STORE_NAMES = {
  REELS: "reels",
  FRAMES: "frames",
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  PREFERENCES: "click-reel-preferences",
  UI_STATE: "click-reel-ui-state",
} as const;

/**
 * Data attribute for excluding elements from capture
 */
export const EXCLUDE_ATTRIBUTE = "data-screenshot-exclude";

/**
 * Data attribute for preserving elements during obfuscation
 */
export const PRESERVE_ATTRIBUTE = "data-screenshot-preserve";
