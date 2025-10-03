/**
 * Keyboard shortcuts management hook
 * Manages global keyboard shortcuts for recorder control
 */

import { useHotkeys } from "react-hotkeys-hook";

export interface KeyboardShortcutHandlers {
  onToggleRecorder?: () => void;
  onToggleObfuscation?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onArmCapture?: () => void;
  onAddFrame?: () => void;
}

export interface KeyboardShortcutConfig {
  toggleRecorder?: string;
  toggleObfuscation?: string;
  startRecording?: string;
  stopRecording?: string;
  armCapture?: string;
  addFrame?: string;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  config?: KeyboardShortcutConfig
): void {
  const shortcuts = {
    toggleRecorder: config?.toggleRecorder || "ctrl+shift+r",
    toggleObfuscation: config?.toggleObfuscation || "ctrl+shift+o",
    startRecording: config?.startRecording || "ctrl+shift+s",
    stopRecording: config?.stopRecording || "ctrl+shift+x",
    armCapture: config?.armCapture || "ctrl+shift+a",
    addFrame: config?.addFrame || "ctrl+shift+f",
  };

  // Toggle recorder UI visibility
  useHotkeys(
    shortcuts.toggleRecorder,
    (e) => {
      e.preventDefault();
      handlers.onToggleRecorder?.();
      console.log("Keyboard shortcut: Toggle recorder");
    },
    { enableOnFormTags: false }
  );

  // Toggle obfuscation mode
  useHotkeys(
    shortcuts.toggleObfuscation,
    (e) => {
      e.preventDefault();
      handlers.onToggleObfuscation?.();
      console.log("Keyboard shortcut: Toggle obfuscation");
    },
    { enableOnFormTags: false }
  );

  // Start recording
  useHotkeys(
    shortcuts.startRecording,
    (e) => {
      e.preventDefault();
      handlers.onStartRecording?.();
      console.log("Keyboard shortcut: Start recording");
    },
    { enableOnFormTags: false }
  );

  // Stop recording
  useHotkeys(
    shortcuts.stopRecording,
    (e) => {
      e.preventDefault();
      handlers.onStopRecording?.();
      console.log("Keyboard shortcut: Stop recording");
    },
    { enableOnFormTags: false }
  );

  // Arm capture (next click)
  useHotkeys(
    shortcuts.armCapture,
    (e) => {
      e.preventDefault();
      handlers.onArmCapture?.();
      console.log("Keyboard shortcut: Arm capture");
    },
    { enableOnFormTags: false }
  );

  // Add frame manually
  useHotkeys(
    shortcuts.addFrame,
    (e) => {
      e.preventDefault();
      handlers.onAddFrame?.();
      console.log("Keyboard shortcut: Add frame");
    },
    { enableOnFormTags: false }
  );
}
