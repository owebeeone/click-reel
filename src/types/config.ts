/**
 * Configuration and options types
 */

/**
 * Options for configuring the capture behavior
 */
export interface CaptureOptions {
  /** The DOM element to capture */
  root: HTMLElement;
  /** Resolution scale (default: 2) */
  scale?: number;
  /** Maximum width for output images */
  maxWidth?: number;
  /** Maximum height for output images */
  maxHeight?: number;
  /** CSS selector for elements to exclude from capture */
  excludeSelector?: string;
  /** Custom styles for the tap marker */
  markerStyle?: MarkerStyle;
  /** Delays (in ms) for post-click frames */
  postDelays?: number[];
  /** Whether to collect HTML snapshots */
  collectHtml?: boolean;
  /** Whether to enable obfuscation */
  obfuscationEnabled?: boolean;
}

/**
 * Style configuration for the tap marker
 */
export interface MarkerStyle {
  /** Size in pixels */
  size?: number;
  /** Color (CSS color value) */
  color?: string;
  /** Opacity (0-1) */
  opacity?: number;
  /** Border width in pixels */
  borderWidth?: number;
  /** Border color */
  borderColor?: string;
  /** Animation duration in ms */
  animationDuration?: number;
}

/**
 * Options for GIF encoding
 */
export interface GIFOptions {
  /** Frames per second */
  fps?: number;
  /** Quality (1-100) */
  quality?: number;
  /** Dithering algorithm */
  dithering?: "none" | "ordered" | "floyd-steinberg";
  /** Maximum colors in palette */
  maxColors?: number;
  /** Whether to loop */
  loop?: boolean;
}

/**
 * Options for APNG encoding
 */
export interface APNGOptions {
  /** Compression level (0-9) */
  compressionLevel?: number;
  /** Whether to loop */
  loop?: boolean;
}

/**
 * User preferences that persist across sessions
 */
export interface UserPreferences {
  /** Preferred marker size */
  markerSize: number;
  /** Preferred marker color */
  markerColor: string;
  /** Preferred export format */
  exportFormat: "gif" | "apng";
  /** Post-click delay in ms */
  postClickDelay: number;
  /** Post-click interval in ms */
  postClickInterval: number;
  /** Maximum capture duration in ms */
  maxCaptureDuration: number;
  /** Scale factor for captures */
  scale: number;
  /** Max dimensions */
  maxWidth?: number;
  maxHeight?: number;
  /** Whether obfuscation is enabled by default */
  obfuscationEnabled: boolean;
  /** Custom keyboard shortcuts */
  keyboardShortcuts: KeyboardShortcuts;
  /** Recorder UI preferences */
  recorderUI: {
    /** Show recorder on startup */
    showOnStartup: boolean;
    /** Start minimized (collapsed) */
    startMinimized: boolean;
  };
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcuts {
  /** Toggle recorder UI */
  toggleRecorder: string;
  /** Toggle obfuscation */
  toggleObfuscation: string;
  /** Arm/disarm capture */
  armCapture: string;
  /** Stop recording */
  stopRecording: string;
  /** Add manual frame */
  addFrame: string;
  /** Toggle settings panel */
  toggleSettings: string;
}

/**
 * Obfuscation configuration
 */
export interface ObfuscationConfig {
  /** Whether to obfuscate text content */
  obfuscateText: boolean;
  /** Whether to obfuscate images */
  obfuscateImages: boolean;
  /** Whether to obfuscate form inputs */
  obfuscateInputs: boolean;
  /** Selector patterns for elements to always preserve */
  preserveSelectors: string[];
  /** Selector patterns for elements to always obfuscate */
  obfuscateSelectors: string[];
  /** Replacement character for text */
  replacementChar: string;
}

/**
 * Storage quota information
 */
export interface StorageInfo {
  /** Number of reels stored */
  reelsCount: number;
  /** Number of frames stored */
  framesCount: number;
  /** Estimated storage size in bytes */
  estimatedSize: number;
  /** Total quota in bytes */
  quota: number;
  /** Used space in bytes */
  usage: number;
  /** Available space in bytes */
  available: number;
  /** Percentage used (0-100) */
  percentUsed: number;
}
