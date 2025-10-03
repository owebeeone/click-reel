/**
 * Core capture engine for creating annotated screenshots
 */

import * as htmlToImage from 'html-to-image';
import { nanoid } from 'nanoid';
import type { Frame, FrameMetadata, CaptureOptions, MarkerStyle } from '../types';
import {
  getElementPath,
  getViewportCoords,
  getRelativeCoords,
  getViewportSize,
  getScrollPosition,
  cloneAndCleanDOM,
  injectMarker,
} from '../utils/dom-utils';
import { DEFAULT_MARKER_STYLE } from '../utils/constants';

/**
 * Captures a single frame from a pointer event
 */
export async function captureFrame(
  root: HTMLElement,
  pointerEvent: PointerEvent,
  options: CaptureOptions,
  reelId: string,
  order: number,
  captureType: 'pre-click' | 'post-click' = 'pre-click'
): Promise<Frame> {
  const frameId = nanoid();
  const timestamp = Date.now();

  // Get coordinates
  const viewportCoords = getViewportCoords(pointerEvent);
  const relativeCoords = getRelativeCoords(pointerEvent, root);

  // Get target element and generate path
  const target = pointerEvent.target as HTMLElement;
  const elementPath = getElementPath(target, root);

  // Get viewport info
  const viewportSize = getViewportSize();
  const scrollPosition = getScrollPosition();

  // Clone and clean the DOM
  const cloned = cloneAndCleanDOM(root, options.excludeSelector);

  // Inject marker for pre-click frames
  let domWithMarker = cloned;
  if (captureType === 'pre-click') {
    const markerStyle: MarkerStyle = {
      ...DEFAULT_MARKER_STYLE,
      ...options.markerStyle,
    };
    domWithMarker = injectMarker(cloned, relativeCoords, pointerEvent.button, markerStyle);
  }

  // Capture the image
  const dataUrl = await captureToDataURL(domWithMarker, options);

  // Build metadata
  const metadata: FrameMetadata = {
    viewportCoords,
    relativeCoords,
    elementPath,
    buttonType: pointerEvent.button,
    viewportSize,
    scrollPosition,
    captureType,
  };

  // Optionally collect HTML snapshot
  if (options.collectHtml) {
    metadata.htmlSnapshot = sanitizeHTML(root.outerHTML);
  }

  // Create frame object
  const frame: Frame = {
    id: frameId,
    reelId,
    image: dataUrl,
    timestamp,
    order,
    metadata,
  };

  return frame;
}

/**
 * Captures DOM element to a data URL using html-to-image
 */
async function captureToDataURL(element: HTMLElement, options: CaptureOptions): Promise<string> {
  try {
    const dataUrl = await htmlToImage.toPng(element, {
      quality: 0.95,
      pixelRatio: options.scale || 2,
      width: options.maxWidth,
      height: options.maxHeight,
      cacheBust: true,
      style: {
        // Ensure the element is visible during capture
        visibility: 'visible',
        opacity: '1',
      },
    });

    return dataUrl;
  } catch (error) {
    console.error('Error capturing frame:', error);
    throw new Error(
      `Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Captures DOM element to Blob
 */
export async function captureToBlob(element: HTMLElement, options: CaptureOptions): Promise<Blob> {
  try {
    const blob = await htmlToImage.toBlob(element, {
      quality: 0.95,
      pixelRatio: options.scale || 2,
      width: options.maxWidth,
      height: options.maxHeight,
      cacheBust: true,
    });

    if (!blob) {
      throw new Error('Failed to generate blob from element');
    }

    return blob;
  } catch (error) {
    console.error('Error capturing to blob:', error);
    throw new Error(
      `Failed to capture to blob: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Converts a data URL to ImageData for comparison
 */
export async function dataURLToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Compares two data URLs to check if images are identical
 */
export function compareImages(dataUrl1: string, dataUrl2: string): boolean {
  return dataUrl1 === dataUrl2;
}

/**
 * Sanitizes HTML for safe storage/export
 * Removes script tags and event handlers
 */
function sanitizeHTML(html: string): string {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove all script tags
  const scripts = temp.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  // Remove event handler attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrs = Array.from(el.attributes);
    attrs.forEach((attr) => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return temp.innerHTML;
}

/**
 * Manually captures a frame without a pointer event
 * Useful for programmatic captures
 */
export async function captureManualFrame(
  root: HTMLElement,
  options: CaptureOptions,
  reelId: string,
  order: number
): Promise<Frame> {
  const frameId = nanoid();
  const timestamp = Date.now();

  // Get viewport info
  const viewportSize = getViewportSize();
  const scrollPosition = getScrollPosition();

  // Clone and clean the DOM (no marker for manual captures)
  const cloned = cloneAndCleanDOM(root, options.excludeSelector);

  // Capture the image
  const dataUrl = await captureToDataURL(cloned, options);

  // Build metadata (no click coordinates for manual capture)
  const metadata: FrameMetadata = {
    viewportCoords: { x: 0, y: 0 },
    relativeCoords: { x: 0, y: 0 },
    elementPath: 'manual-capture',
    buttonType: -1,
    viewportSize,
    scrollPosition,
    captureType: 'post-click', // Manual captures are like post-click frames
  };

  // Optionally collect HTML snapshot
  if (options.collectHtml) {
    metadata.htmlSnapshot = sanitizeHTML(root.outerHTML);
  }

  const frame: Frame = {
    id: frameId,
    reelId,
    image: dataUrl,
    timestamp,
    order,
    metadata,
  };

  return frame;
}
