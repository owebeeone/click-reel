/**
 * Hook for recorder operations and lifecycle management
 */

import { useCallback } from "react";
import { nanoid } from "nanoid";
import { useClickReelContext } from "../context/ClickReelContext";
import { ActionType, type RecorderAPI, type Reel } from "../../types";
import { getStorageService } from "../../core/storage";
import { exportAndDownload, type ExportFormat } from "../../core/export";
import { captureFrame } from "../../core/capture";
import { generateReelMetadata } from "../../core/metadata";

/**
 * Hook for recording operations
 */
export function useRecorder(): RecorderAPI {
  const { state, dispatch } = useClickReelContext();

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

      // Find the root element to capture - use React root or fallback to body
      const captureRoot =
        document.getElementById("root") ||
        document.querySelector("[data-reactroot]") ||
        document.querySelector("#__next") ||
        document.body;

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

      dispatch({
        type: ActionType.ADD_FRAME,
        payload: { reelId: state.currentReel.id, frameId: frame.id },
      });
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
