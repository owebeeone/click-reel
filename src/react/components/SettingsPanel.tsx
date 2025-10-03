/**
 * Settings panel component
 * Allows users to configure preferences
 */

import { useState, useEffect } from "react";
import { UserPreferences } from "../../types/config";
import { Settings, X, RotateCcw, Check } from "lucide-react";

export interface SettingsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Current preferences */
  preferences: UserPreferences;
  /** Callback when preferences are saved */
  onSave: (preferences: UserPreferences) => void;
  /** Callback to reset to defaults */
  onReset: () => void;
}

/**
 * Convert milliseconds to logarithmic slider position (0-100)
 */
function msToLogPosition(ms: number, min: number, max: number): number {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logValue = Math.log(Math.max(min, ms));
  return ((logValue - logMin) / (logMax - logMin)) * 100;
}

/**
 * Convert logarithmic slider position (0-100) to milliseconds
 */
function logPositionToMs(position: number, min: number, max: number): number {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logValue = logMin + (position / 100) * (logMax - logMin);
  return Math.round(Math.exp(logValue));
}

/**
 * Settings panel with form inputs for all preferences
 */
export function SettingsPanel({
  isOpen,
  onClose,
  preferences,
  onSave,
  onReset,
}: SettingsPanelProps) {
  const [localPreferences, setLocalPreferences] =
    useState<UserPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with external preferences
  useEffect(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences, isOpen]);

  const handleChange = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setLocalPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    onReset();
    setHasChanges(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "2rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Settings size={24} style={{ color: "#3b82f6" }} />
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b" }}>
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              color: "#64748b",
            }}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1.5rem",
          }}
        >
          {/* Marker Settings */}
          <section style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Marker Appearance
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* Marker Size */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.5rem",
                  }}
                >
                  Size: {localPreferences.markerSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={localPreferences.markerSize}
                  onChange={(e) =>
                    handleChange("markerSize", parseInt(e.target.value))
                  }
                  style={{ width: "100%" }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Size of the click marker in pixels (20-100)
                </p>
              </div>

              {/* Marker Color */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.5rem",
                  }}
                >
                  Color
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="color"
                    value={localPreferences.markerColor}
                    onChange={(e) =>
                      handleChange("markerColor", e.target.value)
                    }
                    style={{
                      width: "60px",
                      height: "40px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="text"
                    value={localPreferences.markerColor}
                    onChange={(e) =>
                      handleChange("markerColor", e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Color of the click marker (hex format)
                </p>
              </div>

              {/* Live Preview */}
              <div
                style={{
                  padding: "1rem",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "100px",
                }}
              >
                <div
                  style={{
                    width: `${localPreferences.markerSize}px`,
                    height: `${localPreferences.markerSize}px`,
                    borderRadius: "50%",
                    background: localPreferences.markerColor,
                    opacity: 0.5,
                    border: "2px solid white",
                  }}
                  title="Marker preview"
                />
              </div>
            </div>
          </section>

          {/* Export Settings */}
          <section style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Export Preferences
            </h3>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: "0.5rem",
                }}
              >
                Default Format
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <label
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: `2px solid ${
                      localPreferences.exportFormat === "gif"
                        ? "#3b82f6"
                        : "#cbd5e1"
                    }`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "center",
                    background:
                      localPreferences.exportFormat === "gif"
                        ? "#eff6ff"
                        : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="gif"
                    checked={localPreferences.exportFormat === "gif"}
                    onChange={() => handleChange("exportFormat", "gif")}
                    style={{ marginRight: "0.5rem" }}
                  />
                  GIF
                </label>
                <label
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: `2px solid ${
                      localPreferences.exportFormat === "apng"
                        ? "#3b82f6"
                        : "#cbd5e1"
                    }`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "center",
                    background:
                      localPreferences.exportFormat === "apng"
                        ? "#eff6ff"
                        : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="apng"
                    checked={localPreferences.exportFormat === "apng"}
                    onChange={() => handleChange("exportFormat", "apng")}
                    style={{ marginRight: "0.5rem" }}
                  />
                  APNG
                </label>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  margin: "0.25rem 0 0",
                }}
              >
                Preferred format for exports
              </p>
            </div>
          </section>

          {/* Timing Settings */}
          <section style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Capture Timing
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* Post-click Delay */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.5rem",
                  }}
                >
                  Post-Click Delay: {localPreferences.postClickDelay}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={msToLogPosition(
                    Math.max(1, localPreferences.postClickDelay),
                    1,
                    2000
                  )}
                  onChange={(e) =>
                    handleChange(
                      "postClickDelay",
                      logPositionToMs(parseFloat(e.target.value), 1, 2000)
                    )
                  }
                  style={{ width: "100%" }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Delay before capturing post-click frames (1-2000ms,
                  logarithmic)
                </p>
              </div>

              {/* Post-click Interval */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.5rem",
                  }}
                >
                  Post-Click Interval: {localPreferences.postClickInterval}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={msToLogPosition(
                    localPreferences.postClickInterval,
                    10,
                    1000
                  )}
                  onChange={(e) =>
                    handleChange(
                      "postClickInterval",
                      logPositionToMs(parseFloat(e.target.value), 10, 1000)
                    )
                  }
                  style={{ width: "100%" }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Time between post-click frames (10-1000ms, logarithmic)
                </p>
              </div>

              {/* Max Capture Duration */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.5rem",
                  }}
                >
                  Max Duration: {localPreferences.maxCaptureDuration}ms (
                  {(localPreferences.maxCaptureDuration / 1000).toFixed(1)}s)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={msToLogPosition(
                    localPreferences.maxCaptureDuration,
                    1000,
                    120000
                  )}
                  onChange={(e) =>
                    handleChange(
                      "maxCaptureDuration",
                      logPositionToMs(parseFloat(e.target.value), 1000, 120000)
                    )
                  }
                  style={{ width: "100%" }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Maximum duration for post-click capture (1000-120000ms,
                  logarithmic)
                </p>
              </div>
            </div>
          </section>

          {/* Capture Quality */}
          <section style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Capture Quality
            </h3>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: "0.5rem",
                }}
              >
                Scale Factor: {localPreferences.scale}x
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.5"
                value={localPreferences.scale}
                onChange={(e) =>
                  handleChange("scale", parseFloat(e.target.value))
                }
                style={{ width: "100%" }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  margin: "0.25rem 0 0",
                }}
              >
                Higher scale = better quality but larger file size (1-3x)
              </p>
            </div>
          </section>

          {/* Privacy */}
          <section style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Privacy
            </h3>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={localPreferences.obfuscationEnabled}
                onChange={(e) =>
                  handleChange("obfuscationEnabled", e.target.checked)
                }
                style={{ width: "20px", height: "20px" }}
              />
              <span style={{ fontSize: "0.875rem", color: "#475569" }}>
                Enable obfuscation by default
              </span>
            </label>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                margin: "0.5rem 0 0 2rem",
              }}
            >
              Automatically blur sensitive information in captures
            </p>
          </section>

          {/* Recorder UI */}
          <section style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Recorder UI
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={localPreferences.recorderUI.showOnStartup}
                  onChange={(e) => {
                    setLocalPreferences((prev) => ({
                      ...prev,
                      recorderUI: {
                        ...prev.recorderUI,
                        showOnStartup: e.target.checked,
                      },
                    }));
                    setHasChanges(true);
                  }}
                  style={{ width: "20px", height: "20px" }}
                />
                <span style={{ fontSize: "0.875rem", color: "#475569" }}>
                  Show recorder on startup
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={localPreferences.recorderUI.startMinimized}
                  onChange={(e) => {
                    setLocalPreferences((prev) => ({
                      ...prev,
                      recorderUI: {
                        ...prev.recorderUI,
                        startMinimized: e.target.checked,
                      },
                    }));
                    setHasChanges(true);
                  }}
                  style={{ width: "20px", height: "20px" }}
                />
                <span style={{ fontSize: "0.875rem", color: "#475569" }}>
                  Start minimized (collapsed)
                </span>
              </label>
            </div>

            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                margin: "0.5rem 0 0 0",
              }}
            >
              Control recorder visibility and initial state
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
            }}
            title="Reset to defaults"
          >
            <RotateCcw size={18} />
            Reset
          </button>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                color: "#64748b",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              style={{
                padding: "0.75rem 1.5rem",
                background: hasChanges ? "#3b82f6" : "#cbd5e1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: hasChanges ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: 600,
              }}
            >
              <Check size={18} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
