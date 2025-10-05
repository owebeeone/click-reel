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
  createMarkerElement,
} from "../utils/dom-utils";
import { DEFAULT_MARKER_STYLE } from "../utils/constants";
import {
  obfuscateInPlace,
  restoreObfuscation,
  DEFAULT_OBFUSCATION_CONFIG,
  type ObfuscationBackup,
} from "../utils/obfuscation";

/**
 * Captures a single frame from a pointer event
 */
export async function captureFrame(
  root: HTMLElement,
  pointerEvent: PointerEvent,
  options: CaptureOptions,
  reelId: string,
  order: number,
  captureType: "pre-click" | "post-click" = "pre-click",
  skipObfuscation: boolean = false
): Promise<Frame> {
  const frameId = nanoid();
  const timestamp = Date.now();

  // Get coordinates
  const viewportCoords = getViewportCoords(pointerEvent);
  const relativeCoords = getRelativeCoords(pointerEvent, root);

  // Get target element and generate path
  // For synthetic events (manual capture), target may be null - use root instead
  const target = (pointerEvent.target as HTMLElement) || root;
  const elementPath = getElementPath(target, root);

  // Calculate relative offset within the clicked element (for marker repositioning after obfuscation)
  const rect = target.getBoundingClientRect();
  const relativeOffset = {
    x: viewportCoords.x - rect.left,
    y: viewportCoords.y - rect.top,
  };

  console.log("🎯 Click offset within element:", {
    element: target.tagName,
    elementRect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
    viewportCoords,
    relativeOffset,
  });

  // Get viewport info
  const viewportSize = getViewportSize();
  const scrollPosition = getScrollPosition();

  // Build metadata
  // Calculate marker coordinates
  // The marker is always added to document.documentElement, which gets transformed
  // by translate(0, -scrollY). To position the marker at viewport coordinates in
  // the final capture, we always need to use viewport + scroll.
  // After transform: (viewport + scroll - scroll) = viewport position ✓
  // This works for BOTH regular content AND fixed elements because they both
  // appear at viewport coordinates in the final transformed capture.
  const markerCoords = {
    x: viewportCoords.x + scrollPosition.x,
    y: viewportCoords.y + scrollPosition.y,
  };

  const metadata: FrameMetadata = {
    viewportCoords,
    relativeCoords,
    elementPath,
    buttonType: pointerEvent.button,
    viewportSize,
    scrollPosition,
    captureType,
    markerCoords, // Store for debugging
  };

  // Pass marker info to be added AFTER obfuscation
  const markerInfo =
    captureType === "pre-click"
      ? {
          targetElement: target,
          relativeOffset: relativeOffset, // Use the calculated offset, not relativeCoords
          viewportCoords,
          scrollPosition,
          buttonType: pointerEvent.button,
          style: {
            ...DEFAULT_MARKER_STYLE,
            ...options.markerStyle,
          },
        }
      : null;

  try {
    // Capture the image (captureToDataURL will add marker AFTER obfuscation)
    const dataUrl = await captureToDataURL(
      root,
      options,
      skipObfuscation,
      markerInfo
    );

    return await finishFrame(
      frameId,
      reelId,
      timestamp,
      order,
      dataUrl,
      metadata,
      options
    );
  } catch (error) {
    throw error;
  }
}

async function finishFrame(
  frameId: string,
  reelId: string,
  timestamp: number,
  order: number,
  dataUrl: string,
  metadata: FrameMetadata,
  options: CaptureOptions
): Promise<Frame> {
  // Optionally collect HTML snapshot
  if (options.collectHtml) {
    const root = document.getElementById("root") || document.body;
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
async function captureToDataURL(
  element: HTMLElement,
  options: CaptureOptions,
  skipObfuscation: boolean = false,
  markerInfo: {
    targetElement: HTMLElement;
    relativeOffset: { x: number; y: number };
    viewportCoords: { x: number; y: number };
    scrollPosition: { x: number; y: number };
    buttonType: number;
    style: MarkerStyle;
  } | null = null
): Promise<string> {
  // Temporarily hide excluded elements during capture
  const excludedElements: Array<{ el: HTMLElement; originalDisplay: string }> =
    [];

  // For in-place obfuscation
  let obfuscationBackup: ObfuscationBackup | null = null;

  try {
    console.log("Capturing element:", element.tagName, {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    });

    // DEBUG: Check for img elements in the DOM
    const allImages = element.querySelectorAll("img");
    console.log("📸 Found", allImages.length, "img elements before capture");
    allImages.forEach((img, idx) => {
      const imgEl = img as HTMLImageElement;
      console.log(`  Image ${idx}:`, {
        src: imgEl.src.substring(0, 100),
        width: imgEl.offsetWidth,
        height: imgEl.offsetHeight,
        display: window.getComputedStyle(imgEl).display,
        visibility: window.getComputedStyle(imgEl).visibility,
        opacity: window.getComputedStyle(imgEl).opacity,
        zIndex: window.getComputedStyle(imgEl).zIndex,
        position: window.getComputedStyle(imgEl).position,
        complete: imgEl.complete,
        naturalWidth: imgEl.naturalWidth,
        naturalHeight: imgEl.naturalHeight,
      });
    });

    // Find and hide all excluded elements using visibility (preserves layout)
    const excludedNodeList = element.querySelectorAll(
      "[data-screenshot-exclude]"
    );
    excludedNodeList.forEach((el) => {
      const htmlEl = el as HTMLElement;
      excludedElements.push({
        el: htmlEl,
        originalDisplay: htmlEl.style.visibility,
      });
      htmlEl.style.visibility = "hidden";
    });

    // Force a reflow to ensure visibility changes are applied
    if (excludedNodeList.length > 0) {
      void element.offsetHeight; // Force reflow
      // Add a tiny delay to ensure DOM update
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Apply obfuscation if enabled (in-place, non-destructive)
    // Skip obfuscation for settlement detection to avoid flashing and false changes
    if (options.obfuscationEnabled && !skipObfuscation) {
      console.log("🔒 Obfuscation enabled, temporarily replacing text...");
      obfuscationBackup = obfuscateInPlace(element, DEFAULT_OBFUSCATION_CONFIG);

      // Force a small delay to ensure text updates are rendered
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Add marker AFTER obfuscation using recalculated position
    let markerElement: HTMLElement | null = null;
    if (markerInfo) {
      // Get element's NEW position after obfuscation (if obfuscation was applied)
      const rectAfter = markerInfo.targetElement.getBoundingClientRect();

      // Calculate marker position: element's new position + original relative offset + scroll
      const markerCoords = {
        x:
          rectAfter.left +
          markerInfo.relativeOffset.x +
          markerInfo.scrollPosition.x,
        y:
          rectAfter.top +
          markerInfo.relativeOffset.y +
          markerInfo.scrollPosition.y,
      };

      console.log("📍 Adding marker:", {
        skipObfuscation,
        obfuscationEnabled: options.obfuscationEnabled,
        originalViewportCoords: markerInfo.viewportCoords,
        elementRectAfter: { left: rectAfter.left, top: rectAfter.top },
        relativeOffset: markerInfo.relativeOffset,
        recalculatedMarkerCoords: markerCoords,
        scroll: markerInfo.scrollPosition,
        expectedFinalPosition: {
          x: markerCoords.x - markerInfo.scrollPosition.x,
          y: markerCoords.y - markerInfo.scrollPosition.y,
        },
      });

      markerElement = createMarkerElement(
        markerCoords,
        markerInfo.buttonType,
        markerInfo.style
      );
      element.appendChild(markerElement);

      // Force reflow
      void element.offsetHeight;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Get the background color of the page/element
    const computedStyle = window.getComputedStyle(element);
    let backgroundColor = computedStyle.backgroundColor;

    // If transparent, try to get body background
    if (
      backgroundColor === "transparent" ||
      backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      const bodyStyle = window.getComputedStyle(document.body);
      backgroundColor = bodyStyle.backgroundColor;
    }

    // If still transparent, default to white
    if (
      backgroundColor === "transparent" ||
      backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      backgroundColor = "#ffffff";
    }

    // Get current scroll position - we need to capture what's currently visible
    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;

    const captureOptions: Record<string, unknown> = {
      quality: 0.95,
      pixelRatio: options.scale || 2,
      cacheBust: true,
      backgroundColor, // Add background color to prevent transparency
      filter: (node: HTMLElement) => {
        // Additional filter to exclude elements with data-screenshot-exclude
        const shouldExclude =
          node.hasAttribute && node.hasAttribute("data-screenshot-exclude");

        // DEBUG: Log img elements that are being filtered
        if (node.tagName === "IMG") {
          console.log(`  🔍 Filter checking IMG:`, {
            src: (node as HTMLImageElement).src.substring(0, 100),
            excluded: shouldExclude,
            width: node.offsetWidth,
            height: node.offsetHeight,
          });
        }

        return !shouldExclude;
      },
    };

    // Set width/height to capture only the visible viewport
    if (options.maxWidth && options.maxWidth > 0) {
      captureOptions.width = options.maxWidth;
    } else {
      captureOptions.width = window.innerWidth;
    }

    if (options.maxHeight && options.maxHeight > 0) {
      captureOptions.height = options.maxHeight;
    } else {
      captureOptions.height = window.innerHeight;
    }

    // Apply scroll transform to capture scrolled content
    // BUT we need to counter-transform fixed-position elements to keep them in place
    const styleTransform = {
      transform: `translate(${-currentScrollX}px, ${-currentScrollY}px)`,
      transformOrigin: "top left",
    };
    captureOptions.style = styleTransform;

    // Find all fixed-position elements and temporarily adjust them
    const fixedElements: Array<{
      el: HTMLElement;
      originalTransform: string;
    }> = [];

    const allElements = element.querySelectorAll("*");
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);
      if (style.position === "fixed") {
        fixedElements.push({
          el: htmlEl,
          originalTransform: htmlEl.style.transform,
        });
        // Counter the document transform with an inverse transform
        const currentTransform = htmlEl.style.transform || "";
        const counterTransform = `translate(${currentScrollX}px, ${currentScrollY}px)`;
        htmlEl.style.transform = currentTransform
          ? `${currentTransform} ${counterTransform}`
          : counterTransform;
      }
    });

    console.log(
      "Capture options with scroll offset and fixed element compensation:",
      {
        width: captureOptions.width,
        height: captureOptions.height,
        scrollX: currentScrollX,
        scrollY: currentScrollY,
        fixedElementsFound: fixedElements.length,
      }
    );

    // Force a reflow to ensure transform changes are applied
    if (fixedElements.length > 0) {
      void element.offsetHeight;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    console.log("🎬 Starting html-to-image capture...");

    // Check if scroll changed during setup
    const scrollBeforeCapture = {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
    };
    if (
      scrollBeforeCapture.x !== currentScrollX ||
      scrollBeforeCapture.y !== currentScrollY
    ) {
      console.warn("⚠️ Scroll position changed during capture setup!", {
        original: { x: currentScrollX, y: currentScrollY },
        current: scrollBeforeCapture,
        delta: {
          x: scrollBeforeCapture.x - currentScrollX,
          y: scrollBeforeCapture.y - currentScrollY,
        },
      });
    }

    // Suppress console.error for known CSS CORS issues during capture
    const originalConsoleError = console.error;
    const suppressedErrors: string[] = [];
    console.error = (...args: any[]) => {
      const message = args.join(" ");
      if (
        message.includes("cssRules") ||
        message.includes("Error inlining remote css") ||
        message.includes("Error loading remote stylesheet") ||
        message.includes("Error while reading CSS rules")
      ) {
        // Silently suppress known CSS CORS errors
        suppressedErrors.push(message);
        return;
      }
      // Pass through other errors
      originalConsoleError.apply(console, args);
    };

    let dataUrl: string;
    try {
      dataUrl = await htmlToImage.toPng(element, captureOptions);
    } catch (error) {
      // Handle CORS errors from external CSS stylesheets
      if (error instanceof Error && error.message.includes("cssRules")) {
        console.warn(
          "⚠️ CSS inlining failed (likely CORS issue with external stylesheets):",
          error.message
        );
        console.log("Retrying capture without CSS inlining...");
        // Retry without font embedding which can cause CSS issues
        const fallbackOptions = {
          ...captureOptions,
          skipFonts: true,
        };
        dataUrl = await htmlToImage.toPng(element, fallbackOptions);
      } else {
        // Re-throw other errors
        throw error;
      }
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
      // Log suppressed errors count if any
      if (suppressedErrors.length > 0) {
        console.log(
          `📷 Suppressed ${suppressedErrors.length} CSS CORS warning(s) during capture`
        );
      }
    }

    // Remove marker before restoring obfuscation
    if (markerElement && element.contains(markerElement)) {
      element.removeChild(markerElement);
    }

    // Restore obfuscated text immediately
    if (obfuscationBackup) {
      restoreObfuscation(obfuscationBackup);
      obfuscationBackup = null;
    }

    // Restore fixed elements immediately
    fixedElements.forEach(({ el, originalTransform }) => {
      if (originalTransform) {
        el.style.transform = originalTransform;
      } else {
        el.style.removeProperty("transform");
      }
    });
    console.log("✅ Capture complete, data URL length:", dataUrl.length);

    // Immediately restore excluded elements
    excludedElements.forEach(({ el, originalDisplay }) => {
      if (originalDisplay) {
        el.style.visibility = originalDisplay;
      } else {
        el.style.removeProperty("visibility");
      }
    });

    console.log(
      "Captured data URL length:",
      dataUrl.length,
      "preview:",
      dataUrl.substring(0, 100)
    );

    // Validate the captured image is not a 1x1 placeholder
    // Real 1x1 PNGs are ~150 bytes, but allow mock data for tests
    const is1x1Placeholder =
      dataUrl.length < 200 && !dataUrl.includes("mockdata");

    if (is1x1Placeholder) {
      console.warn(
        "Captured image appears to be a 1x1 placeholder - element may not be visible or has no dimensions"
      );
      console.warn("Element dimensions:", {
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      });
      // Don't throw in production - let it through with a warning
      // The encoder will catch actual encoding issues
    }

    return dataUrl;
  } catch (error) {
    // Restore obfuscated text on error
    if (obfuscationBackup) {
      try {
        restoreObfuscation(obfuscationBackup);
      } catch (cleanupError) {
        console.warn("Error restoring obfuscated text:", cleanupError);
      }
    }

    // Restore excluded elements on error
    excludedElements.forEach(({ el, originalDisplay }) => {
      if (originalDisplay) {
        el.style.visibility = originalDisplay;
      } else {
        el.style.removeProperty("visibility");
      }
    });

    console.error("Error capturing frame:", error);
    throw new Error(
      `Failed to capture screenshot: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Captures DOM element to Blob
 */
export async function captureToBlob(
  element: HTMLElement,
  options: CaptureOptions
): Promise<Blob> {
  try {
    // Get the background color of the page/element
    const computedStyle = window.getComputedStyle(element);
    let backgroundColor = computedStyle.backgroundColor;

    // If transparent, try to get body background
    if (
      backgroundColor === "transparent" ||
      backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      const bodyStyle = window.getComputedStyle(document.body);
      backgroundColor = bodyStyle.backgroundColor;
    }

    // If still transparent, default to white
    if (
      backgroundColor === "transparent" ||
      backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      backgroundColor = "#ffffff";
    }

    // Get current scroll position to capture what's visible
    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;

    // Find and counter-transform fixed-position elements
    const fixedElements: Array<{
      el: HTMLElement;
      originalTransform: string;
    }> = [];

    const allElements = element.querySelectorAll("*");
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);
      if (style.position === "fixed") {
        fixedElements.push({
          el: htmlEl,
          originalTransform: htmlEl.style.transform,
        });
        const currentTransform = htmlEl.style.transform || "";
        const counterTransform = `translate(${currentScrollX}px, ${currentScrollY}px)`;
        htmlEl.style.transform = currentTransform
          ? `${currentTransform} ${counterTransform}`
          : counterTransform;
      }
    });

    // Immediate capture - no delay to reduce flashing
    if (fixedElements.length > 0) {
      void element.offsetHeight;
    }

    // Suppress console.error for known CSS CORS issues during capture
    const originalConsoleError = console.error;
    const suppressedErrors: string[] = [];
    console.error = (...args: any[]) => {
      const message = args.join(" ");
      if (
        message.includes("cssRules") ||
        message.includes("Error inlining remote css") ||
        message.includes("Error loading remote stylesheet") ||
        message.includes("Error while reading CSS rules")
      ) {
        // Silently suppress known CSS CORS errors
        suppressedErrors.push(message);
        return;
      }
      // Pass through other errors
      originalConsoleError.apply(console, args);
    };

    let blob: Blob | null;
    const captureOpts = {
      quality: 0.95,
      pixelRatio: options.scale || 2,
      width: options.maxWidth || window.innerWidth,
      height: options.maxHeight || window.innerHeight,
      cacheBust: true,
      backgroundColor, // Add background color to prevent transparency
      style: {
        transform: `translate(${-currentScrollX}px, ${-currentScrollY}px)`,
        transformOrigin: "top left",
      },
    };

    try {
      blob = await htmlToImage.toBlob(element, captureOpts);
    } catch (error) {
      // Handle CORS errors from external CSS stylesheets
      if (error instanceof Error && error.message.includes("cssRules")) {
        console.warn(
          "⚠️ CSS inlining failed during blob capture (likely CORS issue):",
          error.message
        );
        console.log("Retrying blob capture without font embedding...");
        blob = await htmlToImage.toBlob(element, {
          ...captureOpts,
          skipFonts: true,
        });
      } else {
        // Re-throw other errors
        throw error;
      }
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
      // Log suppressed errors count if any
      if (suppressedErrors.length > 0) {
        console.log(
          `📷 Suppressed ${suppressedErrors.length} CSS CORS warning(s) during blob capture`
        );
      }
    }

    // Restore fixed elements
    fixedElements.forEach(({ el, originalTransform }) => {
      if (originalTransform) {
        el.style.transform = originalTransform;
      } else {
        el.style.removeProperty("transform");
      }
    });

    if (!blob) {
      throw new Error("Failed to generate blob from element");
    }

    return blob;
  } catch (error) {
    console.error("Error capturing to blob:", error);
    throw new Error(
      `Failed to capture to blob: ${error instanceof Error ? error.message : "Unknown error"}`
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
