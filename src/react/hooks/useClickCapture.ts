/**
 * Click capture event management hook
 * Manages pointer event listeners and captures frames on click when armed
 */

import { useEffect, useRef } from "react";

export interface ClickCaptureOptions {
  /** Whether the recorder is armed and ready to capture */
  armed: boolean;
  /** The root element to attach listeners to */
  root: HTMLElement;
  /** Callback when a click is captured */
  onCapture: (event: PointerEvent) => void;
  /** Whether recording is active */
  isRecording: boolean;
}

/**
 * Hook for managing pointer event listeners during armed recording
 */
export function useClickCapture(options: ClickCaptureOptions): void {
  const { armed, root, onCapture, isRecording } = options;
  const captureHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);

  useEffect(() => {
    // Only attach listeners if recording and armed
    if (!isRecording || !armed || !root) {
      return;
    }

    console.log("Attaching click capture listener");

    // Create the capture handler
    const handlePointerDown = (event: PointerEvent) => {
      console.log("Click captured!", {
        x: event.clientX,
        y: event.clientY,
        target: (event.target as HTMLElement)?.tagName,
      });

      // Call the capture callback
      onCapture(event);

      // Prevent default to stop any default browser behavior
      event.preventDefault();

      // Stop propagation to prevent the click from triggering other handlers
      // This prevents modals from closing when clicking while armed
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    // Store the handler ref for cleanup
    captureHandlerRef.current = handlePointerDown;

    // Attach the listener with capture phase to intercept clicks first
    root.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: false,
    });

    console.log("Click capture listener attached to", root.tagName);

    // Cleanup function
    return () => {
      if (captureHandlerRef.current) {
        console.log("Removing click capture listener");
        root.removeEventListener("pointerdown", captureHandlerRef.current, {
          capture: true,
        });
        captureHandlerRef.current = null;
      }
    };
  }, [armed, root, onCapture, isRecording]);
}
