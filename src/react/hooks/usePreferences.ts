/**
 * Preferences management hook
 * Manages user preferences with localStorage persistence
 */

import { useState, useEffect, useCallback } from "react";
import { UserPreferences } from "../../types/config";
import { STORAGE_KEYS } from "../../utils/constants";

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  markerSize: 50,
  markerColor: "#ff0000",
  exportFormat: "gif",
  postClickDelay: 100,
  postClickInterval: 50,
  maxCaptureDuration: 30000,
  scale: 2,
  maxWidth: undefined,
  maxHeight: undefined,
  obfuscationEnabled: false,
  keyboardShortcuts: {
    toggleRecorder: "ctrl+shift+r",
    toggleObfuscation: "ctrl+shift+o",
    armCapture: "ctrl+shift+a",
    stopRecording: "ctrl+shift+s",
    addFrame: "ctrl+shift+f",
    toggleSettings: "ctrl+shift+g",
  },
  recorderUI: {
    showOnStartup: true,
    startMinimized: false,
  },
};

/**
 * Hook for managing user preferences
 */
export function usePreferences() {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: UserPreferences) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      throw error;
    }
  }, []);

  // Update a single preference
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      const updated = { ...preferences, [key]: value };
      savePreferences(updated);
    },
    [preferences, savePreferences]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Clear all preferences
  const clearPreferences = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
      setPreferences(DEFAULT_PREFERENCES);
    } catch (error) {
      console.error("Failed to clear preferences:", error);
    }
  }, []);

  return {
    preferences,
    isLoaded,
    savePreferences,
    updatePreference,
    resetToDefaults,
    clearPreferences,
  };
}
