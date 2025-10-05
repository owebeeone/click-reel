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

// MODULE-LEVEL guard to prevent double attachment across ALL instances
let globalListenerAttached = false;
let globalAttachedRoot: HTMLElement | null = null;

/**
 * Hook for managing pointer event listeners during armed recording
 */
export function useClickCapture(options: ClickCaptureOptions): void {
  const { armed, root, onCapture, isRecording } = options;
  const listenerAttachedRef = useRef(false);

  useEffect(() => {
    // Only attach listeners if recording and armed
    if (!isRecording || !armed || !root) {
      return;
    }

    // Prevent double-attachment (React Strict Mode or rapid re-renders)
    if (listenerAttachedRef.current) {
      console.warn(
        "⚠️ [Instance] Listener already attached - skipping duplicate attachment"
      );
      return;
    }

    // CRITICAL: Check module-level guard
    if (globalListenerAttached && globalAttachedRoot === root) {
      console.warn(
        "⚠️ [GLOBAL] Listener already attached to this root - skipping duplicate attachment"
      );
      return;
    }

    console.log("Attaching click capture listener");
    listenerAttachedRef.current = true;
    globalListenerAttached = true;
    globalAttachedRoot = root;

    // Create the capture handler - intercept, capture, then replay
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;

      // Skip replayed events (marked with our custom property)
      if ((event as any).__clickReelReplayed) {
        console.log("⏭️ [useClickCapture] Skipping replayed event");
        return;
      }

      console.log("🔍 [useClickCapture] Pointer down detected:", {
        target: target?.tagName,
        id: target?.id,
        className: target?.className,
        hasScreenshotExclude: !!target.closest(
          '[data-screenshot-exclude="true"]'
        ),
        hasPiiDisable: !!target.closest(".pii-disable"),
      });

      // Check if click is on Click Reel UI (recorder, settings, inventory)
      // If so, skip capture but DON'T interfere with the event
      const isClickReelUI =
        target.closest('[data-screenshot-exclude="true"]') ||
        target.closest(".pii-disable");

      if (isClickReelUI) {
        console.log(
          "⏭️ [useClickCapture] Click on Click Reel UI - SKIPPING capture (event flows normally)"
        );
        return; // Skip capture, but event continues normally
      }

      console.log("📸 [useClickCapture] Click on PAGE CONTENT - CAPTURING:", {
        x: event.clientX,
        y: event.clientY,
        target: target?.tagName,
      });

      // CRITICAL: Store event details and prevent default behavior
      const clickTarget = target;
      const clickDetails = {
        clientX: event.clientX,
        clientY: event.clientY,
        button: event.button,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      };

      // Prevent the original event from propagating
      event.preventDefault();
      event.stopPropagation();
      console.log("🛑 [useClickCapture] Prevented original event");

      // Start capture immediately
      console.log("✅ [useClickCapture] Invoking capture callback (sync)");
      onCapture(event);

      // Replay the click after a short delay to let capture start
      setTimeout(() => {
        console.log(
          "🔄 [useClickCapture] Replaying click on",
          clickTarget?.tagName
        );

        // Create and dispatch a new click event (marked as replayed)
        const newClickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: clickDetails.clientX,
          clientY: clickDetails.clientY,
          button: clickDetails.button,
          ctrlKey: clickDetails.ctrlKey,
          shiftKey: clickDetails.shiftKey,
          altKey: clickDetails.altKey,
          metaKey: clickDetails.metaKey,
        });

        // Mark this event as replayed to avoid re-capturing it
        (newClickEvent as any).__clickReelReplayed = true;

        clickTarget.dispatchEvent(newClickEvent);
        console.log("✅ [useClickCapture] Click replayed successfully");
      }, 50); // Small delay to let capture sequence start
    };

    // CRITICAL: Also intercept click events and only allow replayed ones
    // This prevents the browser's natural click from firing (it converts pointerdown → click)
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Allow replayed clicks through
      if ((event as any).__clickReelReplayed) {
        console.log("✅ [useClickCapture] Allowing replayed click through");
        return;
      }

      // Check if this is a Click Reel UI click (should flow normally)
      const isClickReelUI =
        target.closest('[data-screenshot-exclude="true"]') ||
        target.closest(".pii-disable");

      if (isClickReelUI) {
        console.log(
          "✅ [useClickCapture] Allowing Click Reel UI click through"
        );
        return;
      }

      // Block all other natural clicks (they've already been captured via pointerdown)
      console.log(
        "🛑 [useClickCapture] Blocking natural click (already captured)"
      );
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    // Attach both listeners in capture phase
    root.addEventListener("pointerdown", handlePointerDown, {
      capture: true, // Capture phase - intercept before target
      passive: false, // MUST be false to allow preventDefault
    });

    root.addEventListener("click", handleClick, {
      capture: true, // Capture phase - intercept before target
      passive: false, // MUST be false to allow preventDefault
    });

    console.log("Click capture listeners attached to", root.tagName);

    // Cleanup function - MUST remove the exact same functions that were added
    return () => {
      console.log("Removing click capture listeners");
      root.removeEventListener("pointerdown", handlePointerDown, {
        capture: true, // Must match the addEventListener options
      });
      root.removeEventListener("click", handleClick, {
        capture: true, // Must match the addEventListener options
      });
      listenerAttachedRef.current = false;
      globalListenerAttached = false;
      globalAttachedRoot = null;
    };
  }, [armed, root, onCapture, isRecording]);
}
