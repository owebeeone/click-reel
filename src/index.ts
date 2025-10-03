/**
 * click-reel - Browser-side interaction recorder
 *
 * Captures annotated screenshots of user interactions and assembles them
 * into animated GIF/APNG files with metadata.
 */

// Export types
export type * from "./types";

// Export React components (will be implemented in later phases)
export { ClickReelProvider } from "./react/ClickReelProvider";
export { ClickReelRecorder } from "./react/ClickReelRecorder";
export { ClickReelInventory } from "./react/ClickReelInventory";
export { ClickReelSettings } from "./react/ClickReelSettings";

// Export inventory components
export { InventoryList } from "./react/components/InventoryList";
export { InventoryItem } from "./react/components/InventoryItem";
export { ReelPlayer } from "./react/components/ReelPlayer";
export { DeleteConfirmDialog } from "./react/components/DeleteConfirmDialog";
export { EmptyState } from "./react/components/EmptyState";
export { MarkerDebugDialog } from "./react/components/MarkerDebugDialog";
export { CaptureDebugDialog } from "./react/components/CaptureDebugDialog";

// Export React hooks
export { useRecorder } from "./react/hooks/useRecorder";
export { useStorage } from "./react/hooks/useStorage";
export { useClickCapture } from "./react/hooks/useClickCapture";
export { useKeyboardShortcuts } from "./react/hooks/useKeyboardShortcuts";

// Export context
export { useClickReelContext } from "./react/context/ClickReelContext";

// Export constants
export * from "./utils/constants";

// Export core functions
export {
  encodeGIF,
  encodeAPNG,
  estimateEncodedSize,
  prepareFramesForEncoding,
  optimizeFrames,
  createPreviewGIF,
  type ProgressCallback,
} from "./core/encoder";

export {
  captureFrame,
  captureManualFrame,
  compareImages,
} from "./core/capture";

export {
  generateReelMetadata,
  exportMetadataJSON,
  generateFilename,
} from "./core/metadata";

export {
  StorageService,
  getStorageService,
  resetStorageService,
} from "./core/storage";

export {
  exportReel,
  downloadBlob,
  downloadExport,
  exportAndDownload,
  createShareableLink,
  estimateExportSize,
  type ExportFormat,
  type ExportOptions,
  type ExportResult,
} from "./core/export";
