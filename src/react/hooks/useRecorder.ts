/**
 * Hook for recorder operations and lifecycle management
 */

import { useCallback, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { useClickReelContext } from "../context/ClickReelContext";
import { ActionType, type RecorderAPI, type Reel } from "../../types";
import { getStorageService } from "../../core/storage";
import { exportAndDownload, type ExportFormat } from "../../core/export";
import { captureFrame } from "../../core/capture";
import { generateReelMetadata } from "../../core/metadata";
import { useClickCapture } from "./useClickCapture";

/**
 * Hook for recording operations
 */
export function useRecorder(): RecorderAPI {
  const { state, dispatch } = useClickReelContext();
  const captureRootRef = useRef<HTMLElement | null>(null);

  // Set up the capture root element - use document.documentElement to capture entire viewport
  useEffect(() => {
    // Use documentElement to capture everything visible (including modals/overlays)
    captureRootRef.current = document.documentElement;
  }, []);

  // Handle page unload to save recording
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        state.recorderState === "recording" ||
        state.recorderState === "armed"
      ) {
        // Save the current reel to storage before unloading
        if (state.currentReel && state.currentReel.frames.length > 0) {
          const storage = getStorageService();
          // Note: This is fire-and-forget in beforeunload
          storage.saveReel(state.currentReel).catch((err) => {
            console.error("Failed to save reel during page unload:", err);
          });
        }

        // Show warning to user
        const message =
          "You have an active recording. Are you sure you want to leave?";
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    const handlePageHide = () => {
      // Attempt to save the current reel when page is hidden
      if (
        (state.recorderState === "recording" ||
          state.recorderState === "armed") &&
        state.currentReel &&
        state.currentReel.frames.length > 0
      ) {
        console.log("Page hide detected, saving recording...");
        const storage = getStorageService();
        storage.saveReel(state.currentReel).catch((err) => {
          console.error("Failed to save reel during page hide:", err);
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [state.recorderState, state.currentReel]);

  const startRecording = useCallback(async () => {
    try {
      const reelId = nanoid();
      const newReel: Reel = {
        id: reelId,
        title: `Recording ${new Date().toLocaleString()}`,
        description: "",
        startTime: Date.now(),
        frames: [],
        settings: {
          markerSize: state.preferences.markerSize,
          markerColor: state.preferences.markerColor,
          exportFormat: state.preferences.exportFormat,
          postClickDelay: state.preferences.postClickDelay,
          postClickInterval: state.preferences.postClickInterval,
          maxCaptureDuration: state.preferences.maxCaptureDuration,
          scale: state.preferences.scale,
          maxWidth: state.preferences.maxWidth,
          maxHeight: state.preferences.maxHeight,
          obfuscationEnabled: state.preferences.obfuscationEnabled,
        },
        metadata: {
          userAgent: navigator.userAgent,
          duration: 0,
          clickCount: 0,
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          url: window.location.href,
        },
      };

      dispatch({ type: ActionType.START_RECORDING, payload: newReel });
    } catch (error) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: {
          message: "Failed to start recording",
          timestamp: Date.now(),
          details: error,
        },
      });
    }
  }, [
    dispatch,
    state.preferences.markerSize,
    state.preferences.markerColor,
    state.preferences.exportFormat,
    state.preferences.postClickDelay,
    state.preferences.postClickInterval,
    state.preferences.maxCaptureDuration,
    state.preferences.scale,
    state.preferences.maxWidth,
    state.preferences.maxHeight,
    state.preferences.obfuscationEnabled,
  ]);

  const arm = useCallback(() => {
    dispatch({ type: ActionType.ARM });
  }, [dispatch]);

  const disarm = useCallback(() => {
    dispatch({ type: ActionType.DISARM });
  }, [dispatch]);

  const addFrame = useCallback(async () => {
    if (!state.currentReel) return;

    try {
      dispatch({
        type: ActionType.SET_LOADING,
        payload: { key: "capturing", value: true },
      });

      // Capture the entire visible viewport (includes modals, overlays, etc.)
      const captureRoot = document.documentElement;

      console.log("Capture root element:", captureRoot.tagName, {
        id: captureRoot.id,
        offsetWidth: captureRoot.offsetWidth,
        offsetHeight: captureRoot.offsetHeight,
      });

      // Capture a manual frame (no event)
      const frame = await captureFrame(
        captureRoot,
        new PointerEvent("click", {
          clientX: window.innerWidth / 2,
          clientY: window.innerHeight / 2,
        }),
        {
          root: captureRoot,
          scale: state.currentReel.settings.scale,
          maxWidth: state.currentReel.settings.maxWidth,
          maxHeight: state.currentReel.settings.maxHeight,
          markerStyle: {
            size: state.currentReel.settings.markerSize,
            color: state.currentReel.settings.markerColor,
          },
          obfuscationEnabled: state.currentReel.settings.obfuscationEnabled,
        },
        state.currentReel.id,
        state.currentReel.frames.length
      );

      // Add frame to reel
      const updatedReel = {
        ...state.currentReel,
        frames: [...state.currentReel.frames, frame],
      };

      dispatch({
        type: ActionType.START_RECORDING,
        payload: updatedReel,
      });

      // Note: No need to dispatch ADD_FRAME here - frame is already in updatedReel
    } catch (error) {
      console.error("Failed to capture frame:", error);
      dispatch({
        type: ActionType.SET_ERROR,
        payload: {
          message: "Failed to capture frame",
          timestamp: Date.now(),
          details: error,
        },
      });
      throw error;
    } finally {
      dispatch({
        type: ActionType.SET_LOADING,
        payload: { key: "capturing", value: false },
      });
    }
  }, [dispatch, state.currentReel]);

  const stopRecording = useCallback(async () => {
    if (!state.currentReel) return;

    // Don't save recordings with zero frames
    if (state.currentReel.frames.length === 0) {
      console.log("⚠️ Skipping save: recording has no frames");
      dispatch({
        type: ActionType.COMPLETE_RECORDING,
        payload: { reelId: state.currentReel.id },
      });
      return;
    }

    try {
      dispatch({
        type: ActionType.SET_LOADING,
        payload: { key: "saving", value: true },
      });

      // Update reel metadata
      const finalReel: Reel = {
        ...state.currentReel,
        endTime: Date.now(),
        metadata: generateReelMetadata(state.currentReel),
      };

      // Save to storage
      const storage = getStorageService();
      await storage.init();
      await storage.saveReel(finalReel);

      // Reload inventory
      const inventory = await storage.loadAllReels();
      dispatch({ type: ActionType.LOAD_INVENTORY, payload: inventory });

      dispatch({
        type: ActionType.COMPLETE_RECORDING,
        payload: { reelId: finalReel.id },
      });
    } catch (error) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: {
          message: "Failed to save recording",
          timestamp: Date.now(),
          details: error,
        },
      });
    } finally {
      dispatch({
        type: ActionType.SET_LOADING,
        payload: { key: "saving", value: false },
      });
    }
  }, [dispatch, state.currentReel]);

  const exportReel = useCallback(
    async (reelId: string, format: ExportFormat = "gif") => {
      try {
        dispatch({
          type: ActionType.SET_LOADING,
          payload: { key: "encoding", value: true },
        });

        // Load the reel if it's not the current one
        let reelToExport = state.currentReel;
        if (!reelToExport || reelToExport.id !== reelId) {
          const storage = getStorageService();
          await storage.init();
          reelToExport = await storage.loadReel(reelId);
        }

        if (!reelToExport) {
          throw new Error("Reel not found");
        }

        await exportAndDownload(reelToExport, {
          format,
          includeMetadata: true,
          includeHTML: format === "zip",
        });
      } catch (error) {
        console.error("Failed to export reel:", error);
        dispatch({
          type: ActionType.SET_ERROR,
          payload: {
            message: "Failed to export reel",
            timestamp: Date.now(),
            details: error,
          },
        });
        throw error;
      } finally {
        dispatch({
          type: ActionType.SET_LOADING,
          payload: { key: "encoding", value: false },
        });
      }
    },
    [dispatch, state.currentReel]
  );

  const clearError = useCallback(() => {
    dispatch({ type: ActionType.CLEAR_ERROR });
  }, [dispatch]);

  // Handler for when a click is captured while armed
  const handleClickCapture = useCallback(
    async (event: PointerEvent) => {
      if (!state.currentReel) return;

      try {
        dispatch({
          type: ActionType.SET_LOADING,
          payload: { key: "capturing", value: true },
        });

        console.log("Capturing click at", {
          x: event.clientX,
          y: event.clientY,
        });

        // Capture the entire visible viewport (includes modals, overlays, etc.)
        const captureRoot = document.documentElement;

        const captureOptions = {
          root: captureRoot,
          scale: state.currentReel.settings.scale,
          maxWidth: state.currentReel.settings.maxWidth,
          maxHeight: state.currentReel.settings.maxHeight,
          markerStyle: {
            size: state.currentReel.settings.markerSize,
            color: state.currentReel.settings.markerColor,
          },
          obfuscationEnabled: state.ui?.obfuscationActive || false,
        };

        // Capture the PRE-CLICK frame with the marker
        const preClickFrame = await captureFrame(
          captureRoot,
          event,
          captureOptions,
          state.currentReel.id,
          state.currentReel.frames.length,
          "pre-click"
        );

        console.log(`✅ Pre-click frame captured: ${preClickFrame.id}`);

        // Add pre-click frame to reel
        let updatedReel = {
          ...state.currentReel,
          frames: [...state.currentReel.frames, preClickFrame],
        };

        dispatch({
          type: ActionType.START_RECORDING,
          payload: updatedReel,
        });

        // Note: No need to dispatch ADD_FRAME here - frame is already in updatedReel

        console.log(
          `📊 Current frame count after pre-click: ${updatedReel.frames.length}`
        );
        console.log("⏳ Starting post-click sequence...");

        // Schedule POST-CLICK frames to capture animation settling
        await schedulePostClickCaptures(
          captureRoot,
          event,
          captureOptions,
          state.currentReel.id,
          updatedReel.frames.length
        );

        console.log(
          `✅ Post-click sequence complete. Final frame count should be visible in state.`
        );

        // Automatically disarm after capture sequence completes
        dispatch({ type: ActionType.DISARM });

        console.log("Click capture sequence completed!");
      } catch (error) {
        console.error("Failed to capture click frame:", error);
        dispatch({
          type: ActionType.SET_ERROR,
          payload: {
            message: "Failed to capture click frame",
            timestamp: Date.now(),
            details: error,
          },
        });
      } finally {
        dispatch({
          type: ActionType.SET_LOADING,
          payload: { key: "capturing", value: false },
        });
      }
    },
    [dispatch, state.currentReel]
  );

  // Schedule post-click frame captures with delay and settled detection
  const schedulePostClickCaptures = useCallback(
    async (
      root: HTMLElement,
      originalEvent: PointerEvent,
      options: any,
      reelId: string,
      startOrder: number
    ) => {
      const postClickDelay = state.currentReel?.settings.postClickDelay || 500;
      const postClickInterval =
        state.currentReel?.settings.postClickInterval || 100;
      const maxCaptureDuration =
        state.currentReel?.settings.maxCaptureDuration || 4000;

      console.log("📋 Post-click capture settings:", {
        postClickDelay,
        postClickInterval,
        maxCaptureDuration,
        startingFrameOrder: startOrder,
      });

      // Wait for initial delay
      console.log(
        `⏱️ Waiting ${postClickDelay}ms before first post-click capture...`
      );
      await new Promise((resolve) => setTimeout(resolve, postClickDelay));

      const startTime = Date.now();
      let previousImageData: string | Blob | null = null;
      let consecutiveIdenticalFrames = 0;
      let frameOrder = startOrder;
      let totalPostClickFrames = 0;

      while (Date.now() - startTime < maxCaptureDuration) {
        try {
          // Capture post-click frame (no marker)
          // Skip obfuscation for settlement detection to avoid flashing and layout changes
          console.log(
            `📸 Capturing settlement detection frame #${totalPostClickFrames + 1}...`
          );
          const detectionFrame = await captureFrame(
            root,
            originalEvent,
            options,
            reelId,
            frameOrder, // Don't increment yet - final frame will use this order
            "post-click",
            true // Skip obfuscation during settlement detection
          );

          console.log(`✅ Detection frame captured: ${detectionFrame.id}`);
          totalPostClickFrames++;

          // Check if settled (two consecutive identical frames)
          // Compare by string representation (data URL or blob URL)
          const currentImageData =
            typeof detectionFrame.image === "string"
              ? detectionFrame.image
              : detectionFrame.image.toString();
          const prevImageData =
            typeof previousImageData === "string"
              ? previousImageData
              : previousImageData?.toString();

          const imageDataLength = currentImageData?.length || 0;
          console.log(`🔍 Image data length: ${imageDataLength} chars`);

          if (prevImageData && currentImageData === prevImageData) {
            consecutiveIdenticalFrames++;
            console.log(
              `🔄 Consecutive identical frames: ${consecutiveIdenticalFrames}`
            );

            if (consecutiveIdenticalFrames >= 1) {
              // Page has settled! Now capture the final frame WITH obfuscation if enabled
              console.log(
                `✅ Animation settled! Capturing final frame with obfuscation...`
              );

              const finalFrame = await captureFrame(
                root,
                originalEvent,
                options,
                reelId,
                frameOrder, // Use same order as last detection frame
                "post-click",
                false // Enable obfuscation for final frame
              );

              // Add ONLY the final settled frame to reel
              dispatch({
                type: ActionType.ADD_FRAME,
                payload: { reelId, frame: finalFrame },
              });

              console.log(
                `✅ Final settled frame added: ${finalFrame.id}. Total detection frames: ${totalPostClickFrames}`
              );
              break;
            }
          } else {
            if (prevImageData) {
              console.log(`🔄 Frame changed, resetting consecutive count`);
            }
            consecutiveIdenticalFrames = 0;
          }

          previousImageData = detectionFrame.image;

          // DON'T add intermediate detection frames to reel - only use them for comparison
          console.log(
            `📊 Detection frame ${totalPostClickFrames} compared (not added to reel)`
          );

          // Wait for next interval
          console.log(
            `⏱️ Waiting ${postClickInterval}ms before next capture...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, postClickInterval)
          );
        } catch (error) {
          console.error("❌ Post-click frame capture failed:", error);
          break;
        }
      }

      if (Date.now() - startTime >= maxCaptureDuration) {
        console.log(
          `⏱️ Max capture duration reached (${maxCaptureDuration}ms), stopping post-click capture. Total frames: ${totalPostClickFrames}`
        );
      }

      console.log(
        `📊 Post-click sequence finished. Total post-click frames captured: ${totalPostClickFrames}`
      );
    },
    [dispatch, state.currentReel]
  );

  // Use click capture hook to listen for clicks when armed
  useClickCapture({
    armed: state.recorderState === "armed",
    root: captureRootRef.current!,
    onCapture: handleClickCapture,
    isRecording:
      state.recorderState === "recording" || state.recorderState === "armed",
  });

  return {
    state: state.recorderState,
    currentReel: state.currentReel,
    startRecording,
    arm,
    disarm,
    addFrame,
    stopRecording,
    exportReel,
    loading: state.loading,
    error: state.error,
    clearError,
  };
}
