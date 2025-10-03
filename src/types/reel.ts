/**
 * Core types for Reel and Frame data structures
 */

/**
 * Represents a single captured frame with metadata
 */
export interface Frame {
  /** Unique identifier for the frame */
  id: string;
  /** The reel this frame belongs to */
  reelId: string;
  /** PNG image data as a Blob or data URL */
  image: Blob | string;
  /** ImageData object for comparison operations */
  imageData?: ImageData;
  /** Timestamp when the frame was captured */
  timestamp: number;
  /** Order/sequence number within the reel */
  order: number;
  /** Frame-specific metadata */
  metadata: FrameMetadata;
}

/**
 * Metadata associated with each captured frame
 */
export interface FrameMetadata {
  /** Click coordinates relative to viewport */
  viewportCoords: { x: number; y: number };
  /** Click coordinates relative to capture root */
  relativeCoords: { x: number; y: number };
  /** CSS selector path to the clicked element */
  elementPath: string;
  /** Pointer button type (0=left, 1=middle, 2=right) */
  buttonType: number;
  /** Viewport dimensions at capture time */
  viewportSize: { width: number; height: number };
  /** Scroll position at capture time */
  scrollPosition: { x: number; y: number };
  /** Whether this is a pre-click or post-click frame */
  captureType: 'pre-click' | 'post-click';
  /** Optional sanitized HTML snapshot */
  htmlSnapshot?: string;
}

/**
 * A complete recording session (reel) containing multiple frames
 */
export interface Reel {
  /** Unique identifier for the reel */
  id: string;
  /** User-editable title */
  title: string;
  /** User-editable description */
  description: string;
  /** Timestamp when recording started */
  startTime: number;
  /** Timestamp when recording ended */
  endTime?: number;
  /** All captured frames */
  frames: Frame[];
  /** Settings used for this recording */
  settings: ReelSettings;
  /** Overall metadata for the reel */
  metadata: ReelMetadata;
}

/**
 * Summary information for displaying reels in inventory
 */
export interface ReelSummary {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime?: number;
  frameCount: number;
  thumbnailUrl?: string;
  estimatedSize: number;
}

/**
 * Settings that were active during a recording
 */
export interface ReelSettings {
  markerSize: number;
  markerColor: string;
  exportFormat: 'gif' | 'apng';
  postClickDelay: number;
  postClickInterval: number;
  maxCaptureDuration: number;
  scale: number;
  maxWidth?: number;
  maxHeight?: number;
  obfuscationEnabled: boolean;
}

/**
 * Comprehensive metadata for the entire reel
 */
export interface ReelMetadata {
  /** User agent string */
  userAgent: string;
  /** Recording duration in milliseconds */
  duration: number;
  /** Total number of clicks captured */
  clickCount: number;
  /** Browser viewport size */
  viewportSize: { width: number; height: number };
  /** URL where recording was made (if applicable) */
  url?: string;
  /** Custom metadata provided by user */
  custom?: Record<string, unknown>;
}
