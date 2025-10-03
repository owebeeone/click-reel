/**
 * Metadata collection and generation utilities
 */

import { format } from 'date-fns';
import type { Reel, ReelMetadata, Frame } from '../types';

/**
 * Generates comprehensive metadata for a reel
 */
export function generateReelMetadata(reel: Reel): ReelMetadata {
  const duration = reel.endTime ? reel.endTime - reel.startTime : Date.now() - reel.startTime;

  const clickCount = reel.frames.filter(
    (frame) => frame.metadata.captureType === 'pre-click'
  ).length;

  // Get viewport size from first frame
  const viewportSize = reel.frames[0]?.metadata.viewportSize || {
    width: 0,
    height: 0,
  };

  return {
    userAgent: navigator.userAgent,
    duration,
    clickCount,
    viewportSize,
    url: window.location.href,
  };
}

/**
 * Exports reel metadata to JSON
 */
export function exportMetadataJSON(reel: Reel): string {
  const metadata = generateReelMetadata(reel);

  const exportData = {
    reel: {
      id: reel.id,
      title: reel.title,
      description: reel.description,
      startTime: format(reel.startTime, 'yyyy-MM-dd HH:mm:ss'),
      endTime: reel.endTime ? format(reel.endTime, 'yyyy-MM-dd HH:mm:ss') : null,
      frameCount: reel.frames.length,
    },
    metadata: {
      ...metadata,
      duration: `${metadata.duration}ms`,
    },
    frames: reel.frames.map((frame) => ({
      id: frame.id,
      order: frame.order,
      timestamp: format(frame.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS'),
      captureType: frame.metadata.captureType,
      elementPath: frame.metadata.elementPath,
      coordinates: {
        viewport: frame.metadata.viewportCoords,
        relative: frame.metadata.relativeCoords,
      },
      buttonType: getButtonName(frame.metadata.buttonType),
      viewportSize: frame.metadata.viewportSize,
      scrollPosition: frame.metadata.scrollPosition,
    })),
    settings: reel.settings,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Gets human-readable button name
 */
function getButtonName(buttonType: number): string {
  switch (buttonType) {
    case 0:
      return 'left';
    case 1:
      return 'middle';
    case 2:
      return 'right';
    case -1:
      return 'manual';
    default:
      return 'unknown';
  }
}

/**
 * Calculates estimated file size for a reel
 */
export function estimateReelSize(frames: Frame[]): number {
  let totalSize = 0;

  frames.forEach((frame) => {
    if (typeof frame.image === 'string') {
      // Data URL - estimate from base64 length
      const base64Length = frame.image.split(',')[1]?.length || 0;
      totalSize += (base64Length * 3) / 4; // Convert base64 to bytes
    } else if (frame.image instanceof Blob) {
      totalSize += frame.image.size;
    }
  });

  return totalSize;
}

/**
 * Formats byte size to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generates a filename for export
 */
export function generateFilename(reel: Reel, extension: 'gif' | 'png' | 'zip' | 'json'): string {
  const timestamp = format(reel.startTime, 'yyyy-MM-dd_HH-mm-ss');
  const safeTitleTitle = reel.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeTitleTitle || 'recording'}_${timestamp}.${extension}`;
}
