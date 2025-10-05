/**
 * Click Reel Demo Application
 */

import { useState, useEffect } from "react";
import {
  ClickReelProvider,
  ClickReelRecorder,
  ClickReelInventory,
  SettingsPanel,
  useRecorder,
  useStorage,
  useClickReelContext,
  usePreferences,
  type ExportFormat,
} from "../src";
import { useKeyboardShortcuts } from "../src/react/hooks/useKeyboardShortcuts";
import { DndContext } from "@dnd-kit/core";
import toast, { Toaster } from "react-hot-toast";
import "./index.css";

function DemoContent({
  recorderPosition,
}: {
  recorderPosition: { x: number; y: number };
}) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("gif");
  const { state, dispatch } = useClickReelContext();
  const recorder = useRecorder();
  const storage = useStorage();
  const [storageInfo, setStorageInfo] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showTestDialog1, setShowTestDialog1] = useState(false);
  const [showTestDialog2, setShowTestDialog2] = useState(false);
  const [counterMs, setCounterMs] = useState(0);

  // Diagnostic: Track dialog state changes
  useEffect(() => {
    console.log(
      "🚪 [Dialog State] TestDialog1:",
      showTestDialog1,
      "TestDialog2:",
      showTestDialog2,
      "Recorder:",
      recorder.state
    );
  }, [showTestDialog1, showTestDialog2, recorder.state]);

  // Preferences hook
  const { preferences, savePreferences, resetToDefaults, isLoaded } =
    usePreferences();

  // Apply preferences to UI state on mount
  useEffect(() => {
    if (!isLoaded) return;

    // Apply showOnStartup preference
    if (!preferences.recorderUI.showOnStartup && state.ui.recorderVisible) {
      dispatch({ type: "TOGGLE_RECORDER_UI" as any });
      console.log(
        "📍 Hiding recorder on startup (showOnStartup preference is false)"
      );
    }

    // Apply obfuscationEnabled preference to runtime state
    if (preferences.obfuscationEnabled !== state.ui?.obfuscationActive) {
      dispatch({ type: "TOGGLE_OBFUSCATION" as any });
      console.log(
        `📍 Setting obfuscation to ${preferences.obfuscationEnabled} (from preference)`
      );
    }
  }, [isLoaded]); // Run when preferences are loaded

  // Counter for test dialog 2 - stops at 5 seconds
  useEffect(() => {
    if (!showTestDialog2) {
      setCounterMs(0);
      return;
    }

    const interval = setInterval(() => {
      setCounterMs((prev) => {
        if (prev >= 5000) {
          clearInterval(interval);
          return prev; // Stop at 5000ms
        }
        return prev + 50;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showTestDialog2]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onToggleRecorder: () => {
      dispatch({ type: "TOGGLE_RECORDER_UI" as any });
      console.log(
        `Toggling recorder visibility to: ${!state.ui.recorderVisible}`
      );
      toast.success(
        `Recorder ${!state.ui.recorderVisible ? "shown" : "hidden"}`,
        {
          duration: 2000,
        }
      );
    },
    onToggleObfuscation: () => {
      dispatch({ type: "TOGGLE_OBFUSCATION" as any });
      toast.success(
        `Obfuscation ${!state.ui?.obfuscationActive ? "enabled" : "disabled"}`,
        {
          duration: 2000,
        }
      );
    },
    onToggleSettings: () => {
      const newShowSettings = !showSettings;
      setShowSettings(newShowSettings);
      console.log(`Toggling settings to: ${newShowSettings}`);
      toast.success(`Settings ${newShowSettings ? "opened" : "closed"}`, {
        duration: 2000,
      });
    },
    onToggleInventory: () => {
      const newShowInventory = !showInventory;
      setShowInventory(newShowInventory);
      console.log(`Toggling inventory to: ${newShowInventory}`);
      toast.success(`Inventory ${newShowInventory ? "opened" : "closed"}`, {
        duration: 2000,
      });
    },
    onStartRecording: () => {
      // Ctrl+Shift+S now toggles start/stop
      if (recorder.state === "idle") {
        handleStartRecording();
      } else if (recorder.state === "recording" || recorder.state === "armed") {
        handleStopRecording();
      }
    },
    onStopRecording: () => {
      // Kept for backward compatibility but unused - startRecording now handles toggle
    },
    onArmCapture: () => {
      if (recorder.state === "recording") {
        recorder.arm();
      }
    },
    onAddFrame: () => {
      if (recorder.state === "recording") {
        handleAddFrame();
      }
    },
  });

  const handleStartRecording = async () => {
    try {
      await recorder.startRecording();
      toast.success(
        "Recording started! Click 'Add Frame' or 'Arm' to capture clicks.",
        { duration: 5000 }
      );
    } catch (error) {
      toast.error(
        `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
        { duration: 5000 }
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      await recorder.stopRecording();
      toast.success("Recording saved!", { duration: 5000 });
      await updateStorageInfo();
    } catch (error) {
      toast.error(
        `Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`,
        { duration: 5000 }
      );
    }
  };

  const handleAddFrame = async () => {
    try {
      await recorder.addFrame();
      toast.success("Frame captured! Check console for capture details.", {
        duration: 5000,
      });
    } catch (error) {
      console.error("Frame capture error:", error);
      toast.error(
        `Failed to capture frame: ${error instanceof Error ? error.message : String(error)}`,
        { duration: 5000 }
      );
    }
  };

  const handleExport = async (reelId?: string) => {
    const targetReelId = reelId || recorder.currentReel?.id;

    if (!targetReelId) {
      toast.error(
        "No reel selected. Start a recording or select a saved reel!",
        {
          duration: 5000,
        }
      );
      return;
    }

    try {
      await recorder.exportReel(targetReelId, exportFormat);
      toast.success(`Exported successfully as ${exportFormat.toUpperCase()}!`, {
        duration: 5000,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`,
        { duration: 5000 }
      );
    }
  };

  const updateStorageInfo = async () => {
    try {
      const info = await storage.getStorageInfo();
      setStorageInfo(
        `Reels: ${info.reelsCount} | Frames: ${info.framesCount} | Size: ${(info.estimatedSize / 1024).toFixed(2)} KB`
      );
    } catch {
      setStorageInfo("Error loading storage info");
    }
  };

  const handleClearStorage = async () => {
    try {
      const inventory = state.inventory;
      for (const reel of inventory) {
        await storage.deleteReel(reel.id);
      }
      await updateStorageInfo();
      toast.success("Storage cleared!", { duration: 5000 });
    } catch (error) {
      toast.error(
        `Clear failed: ${error instanceof Error ? error.message : String(error)}`,
        { duration: 5000 }
      );
    }
  };

  const handleLoadInventory = async () => {
    try {
      await storage.loadInventory();
      await updateStorageInfo();
      toast.success(`Loaded ${state.inventory.length} reels`, {
        duration: 5000,
      });
    } catch (error) {
      toast.error(
        `Failed to load inventory: ${error instanceof Error ? error.message : String(error)}`,
        { duration: 5000 }
      );
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <ClickReelRecorder
        visible={state.ui.recorderVisible}
        position={recorderPosition}
        initialCollapsed={preferences.recorderUI.startMinimized}
        onCollapsedChange={(collapsed) => {
          // Persist collapsed state to preferences
          savePreferences({
            ...preferences,
            recorderUI: {
              ...preferences.recorderUI,
              startMinimized: collapsed,
            },
          });
        }}
        onInventoryClick={() => setShowInventory(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      <h1 style={{ color: "#333", marginBottom: "0.5rem" }}>
        Click Reel Playground 🎬
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Test the click-reel library with real state management!
      </p>

      {/* Keyboard Shortcuts Guide */}
      <section
        style={{
          padding: "1rem",
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ margin: "0 0 0.5rem 0" }}>⌨️ Keyboard Shortcuts</h3>
        <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
          <div>
            <code>Ctrl+Shift+R</code> - Toggle Recorder Visibility
          </div>
          <div>
            <code>Ctrl+Shift+O</code> - Toggle Obfuscation
          </div>
          <div>
            <code>Ctrl+Shift+G</code> - Toggle Settings Panel
          </div>
          <div>
            <code>Ctrl+Shift+E</code> - Toggle Inventory Panel
          </div>
          <div>
            <code>Ctrl+Shift+S</code> - Start/Stop Recording (toggle)
          </div>
          <div>
            <code>Ctrl+Shift+A</code> - Arm Capture (when recording)
          </div>
          <div>
            <code>Ctrl+Shift+F</code> - Add Frame (when recording)
          </div>
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "12px", color: "#666" }}>
          Status: Recorder {state.ui.recorderVisible ? "Visible" : "Hidden"} |
          Obfuscation {state.ui?.obfuscationActive ? "Enabled" : "Disabled"}
        </div>
      </section>

      {/* Current State Display */}
      <section
        style={{
          background: "#e3f2fd",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          border: "2px solid #2196f3",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Current State
        </h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div>
            <strong>Recorder State:</strong>{" "}
            <span
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "12px",
                background:
                  recorder.state === "recording"
                    ? "#4caf50"
                    : recorder.state === "armed"
                      ? "#ff9800"
                      : "#9e9e9e",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {recorder.state.toUpperCase()}
            </span>
          </div>
          <div>
            <strong>Current Reel:</strong>{" "}
            {recorder.currentReel ? (
              <span>
                {recorder.currentReel.title} (
                {recorder.currentReel.frames.length} frames)
              </span>
            ) : (
              <span style={{ color: "#999" }}>None</span>
            )}
          </div>
          <div>
            <strong>Inventory:</strong> {state.inventory.length} reels
          </div>
          <div>
            <strong>Loading:</strong>{" "}
            {recorder.loading.capturing && "Capturing... "}
            {recorder.loading.encoding && "Encoding... "}
            {recorder.loading.saving && "Saving... "}
            {!recorder.loading.capturing &&
              !recorder.loading.encoding &&
              !recorder.loading.saving && (
                <span style={{ color: "#4caf50" }}>Ready</span>
              )}
          </div>
          {recorder.error && (
            <div style={{ color: "#f44336" }}>
              <strong>Error:</strong> {recorder.error.message}
            </div>
          )}
        </div>
      </section>

      {/* Recorder Controls */}
      <section
        style={{
          background: "#f9f9f9",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Recorder Controls
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleStartRecording}
            disabled={recorder.state !== "idle"}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: recorder.state !== "idle" ? "#ccc" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: recorder.state !== "idle" ? "not-allowed" : "pointer",
            }}
          >
            Start Recording
          </button>
          <button
            onClick={() => recorder.arm()}
            disabled={recorder.state !== "recording"}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor:
                recorder.state !== "recording" ? "#ccc" : "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                recorder.state !== "recording" ? "not-allowed" : "pointer",
            }}
          >
            Arm (Next Click)
          </button>
          <button
            onClick={() => recorder.disarm()}
            disabled={recorder.state !== "armed"}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: recorder.state !== "armed" ? "#ccc" : "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: recorder.state !== "armed" ? "not-allowed" : "pointer",
            }}
          >
            Disarm
          </button>
          <button
            onClick={handleAddFrame}
            disabled={recorder.state !== "recording"}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor:
                recorder.state !== "recording" ? "#ccc" : "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                recorder.state !== "recording" ? "not-allowed" : "pointer",
            }}
          >
            Add Frame
          </button>
          <button
            onClick={handleStopRecording}
            disabled={recorder.state !== "recording"}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor:
                recorder.state !== "recording" ? "#ccc" : "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                recorder.state !== "recording" ? "not-allowed" : "pointer",
            }}
          >
            Stop & Save
          </button>
        </div>
        <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
          Workflow: Start → Add Frames or Arm for clicks → Stop & Save
        </p>
      </section>

      {/* Export Section */}
      <section
        style={{
          background: "#f0f8ff",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Export Recordings
        </h2>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Export Format:
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            style={{
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginRight: "1rem",
            }}
          >
            <option value="gif">GIF</option>
            <option value="apng">APNG</option>
            <option value="zip">
              ZIP Bundle (GIF + APNG + Metadata + Viewer)
            </option>
          </select>
        </div>
        {recorder.currentReel && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#e8f5e9",
              borderRadius: "4px",
              border: "1px solid #4caf50",
            }}
          >
            <strong>Current Recording:</strong> {recorder.currentReel.title} (
            {recorder.currentReel.frames.length} frames)
            <button
              onClick={() => handleExport()}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "1rem",
              }}
            >
              Export Current
            </button>
          </div>
        )}
      </section>

      {/* Storage Management */}
      <section
        style={{
          background: "#f0fff0",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Storage Management
        </h2>
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={handleLoadInventory}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "1rem",
            }}
          >
            Refresh Inventory
          </button>
          <button
            onClick={updateStorageInfo}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "1rem",
            }}
          >
            Update Stats
          </button>
          <button
            onClick={handleClearStorage}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear All Storage
          </button>
        </div>
        {storageInfo && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "white",
              borderRadius: "4px",
              border: "1px solid #d4edda",
            }}
          >
            <strong>Storage Info:</strong> {storageInfo}
          </div>
        )}
        {state.inventory.length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "white",
              borderRadius: "4px",
              border: "1px solid #d4edda",
            }}
          >
            <strong>Saved Reels:</strong>
            <div style={{ marginTop: "0.5rem" }}>
              {state.inventory.map((reel) => (
                <div
                  key={reel.id}
                  style={{
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px solid #dee2e6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    <strong>{reel.title}</strong> - {reel.frameCount} frames (
                    {new Date(reel.startTime).toLocaleString()})
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleExport(reel.id)}
                      disabled={reel.frameCount === 0}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.85rem",
                        backgroundColor:
                          reel.frameCount === 0 ? "#ccc" : "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          reel.frameCount === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      Export
                    </button>
                    <button
                      onClick={() => storage.deleteReel(reel.id)}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.85rem",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Inventory Section */}
      <section style={{ marginTop: "3rem" }}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            color: "#1e293b",
          }}
        >
          📼 Click Reel Inventory
        </h2>
        <ClickReelInventory
          onStartRecording={handleStartRecording}
          style={{ padding: 0 }}
        />
      </section>

      {/* Settings */}
      <section style={{ marginTop: "2rem" }}>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          ⚙️ Open Settings
        </button>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "0.5rem" }}>
          Configure preferences: marker appearance, capture timing, export
          format, etc.
        </p>
      </section>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onSave={(newPrefs) => {
          // Check if obfuscation setting changed
          const obfuscationChanged =
            newPrefs.obfuscationEnabled !== preferences.obfuscationEnabled;

          savePreferences(newPrefs);

          // Sync runtime state if obfuscation changed
          if (
            obfuscationChanged &&
            newPrefs.obfuscationEnabled !== state.ui?.obfuscationActive
          ) {
            dispatch({ type: "TOGGLE_OBFUSCATION" as any });
            console.log(
              `📍 Syncing obfuscation to ${newPrefs.obfuscationEnabled} (from settings save)`
            );
          }

          toast.success("Settings saved!", { duration: 3000 });
        }}
        onReset={() => {
          resetToDefaults();
          toast.success("Reset to defaults!", { duration: 3000 });
        }}
      />

      {/* Inventory Panel */}
      {showInventory && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setShowInventory(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ margin: 0, color: "#1e293b" }}>Saved Reels</h2>
              <button
                onClick={() => setShowInventory(false)}
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#475569",
                }}
              >
                Close
              </button>
            </div>
            <ClickReelInventory />
          </div>
        </div>
      )}

      {/* Recorder Component */}
      {/* Recorder Testing - Now using floating recorder at top */}

      {/* Interactive Test Area */}
      <section
        style={{
          background: "#fff9f0",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Interactive Test Area
        </h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Click these elements when armed to test interaction capture:
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "1rem 2rem",
              fontSize: "1rem",
              backgroundColor: "#6f42c1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("🟢 [BUTTON CLICK] Opening TestDialog1");
              setShowTestDialog1(true);
            }}
          >
            Test Button 1 (Static Dialog)
          </button>
          <button
            style={{
              padding: "1rem 2rem",
              fontSize: "1rem",
              backgroundColor: "#fd7e14",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTestDialog2(true);
            }}
          >
            Test Button 2 (Animated Dialog)
          </button>
          <input
            type="text"
            placeholder="Type here..."
            className="pii-enable"
            style={{
              padding: "1rem",
              fontSize: "1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      </section>

      {/* Test Dialog 1 - Static */}
      {showTestDialog1 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            console.log("🔴 [BACKDROP CLICK] Closing TestDialog1");
            setShowTestDialog1(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>
              Test Dialog 1
            </h2>
            <p style={{ margin: "0 0 1.5rem 0", color: "#64748b" }}>
              This is a static dialog for testing click capture. The content
              doesn't change, so settlement detection should recognize it
              immediately.
            </p>
            <button
              onClick={(e) => {
                console.log("🔴 [CLOSE BUTTON] Closing TestDialog1", {
                  armed: recorder.state === "armed",
                  recording: recorder.state === "recording",
                });
                e.stopPropagation();
                setShowTestDialog1(false);
                console.log(
                  "🔴 [CLOSE BUTTON] setShowTestDialog1(false) called"
                );
              }}
              style={{
                padding: "8px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Test Dialog 2 - Animated Counter */}
      {showTestDialog2 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowTestDialog2(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>
              Test Dialog 2 - Animated
            </h2>
            <p style={{ margin: "0 0 1rem 0", color: "#64748b" }}>
              This dialog has a counter that updates every 50ms for 5 seconds.
              Settlement detection should wait until the counter stops.
            </p>
            <div
              style={{
                padding: "1rem",
                background: counterMs >= 5000 ? "#dcfce7" : "#f1f5f9",
                borderRadius: "8px",
                marginBottom: "1rem",
                textAlign: "center",
                border: counterMs >= 5000 ? "2px solid #22c55e" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: counterMs >= 5000 ? "#16a34a" : "#64748b",
                  marginBottom: "0.5rem",
                }}
              >
                {counterMs >= 5000
                  ? "✅ Counter stopped!"
                  : "Counter (updates every 50ms):"}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: counterMs >= 5000 ? "#16a34a" : "#1e293b",
                }}
              >
                {counterMs} ms
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTestDialog2(false);
              }}
              style={{
                padding: "8px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent({
  recorderPosition,
  onDragEnd,
}: {
  recorderPosition: { x: number; y: number };
  onDragEnd: (event: any) => void;
}) {
  return (
    <DndContext onDragEnd={onDragEnd}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#4caf50",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#f44336",
              secondary: "#fff",
            },
          },
        }}
      />
      <DemoContent recorderPosition={recorderPosition} />
    </DndContext>
  );
}

/**
 * Sanitize recorder position to ensure it's within the viewport
 */
function sanitizeRecorderPosition(pos: { x: number; y: number }): {
  x: number;
  y: number;
} {
  const recorderWidth = 280; // Approximate width of the recorder
  const recorderHeight = 400; // Approximate height of the recorder
  const minMargin = 20; // Minimum margin from viewport edges

  // Ensure position is within viewport bounds
  const maxX = window.innerWidth - recorderWidth - minMargin;
  const maxY = window.innerHeight - recorderHeight - minMargin;

  const sanitized = {
    x: Math.max(minMargin, Math.min(pos.x, maxX)),
    y: Math.max(minMargin, Math.min(pos.y, maxY)),
  };

  // Log if position was adjusted
  if (sanitized.x !== pos.x || sanitized.y !== pos.y) {
    console.log(
      `📍 Recorder position sanitized: (${pos.x}, ${pos.y}) → (${sanitized.x}, ${sanitized.y})`
    );
  }

  return sanitized;
}

function App() {
  const [recorderPosition, setRecorderPosition] = useState(() => {
    try {
      const stored = localStorage.getItem("click-reel-position");
      const position = stored
        ? JSON.parse(stored)
        : { x: window.innerWidth - 300, y: 20 };

      // Sanitize the loaded position
      return sanitizeRecorderPosition(position);
    } catch {
      return sanitizeRecorderPosition({ x: window.innerWidth - 300, y: 20 });
    }
  });

  // Handle window resize - reposition recorder if it's now off-screen
  useEffect(() => {
    const handleResize = () => {
      setRecorderPosition((prev) => sanitizeRecorderPosition(prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragEnd = (event: any) => {
    if (event.active.id === "click-reel-recorder") {
      const newPosition = sanitizeRecorderPosition({
        x: recorderPosition.x + event.delta.x,
        y: recorderPosition.y + event.delta.y,
      });
      setRecorderPosition(newPosition);
      try {
        localStorage.setItem(
          "click-reel-position",
          JSON.stringify(newPosition)
        );
      } catch (err) {
        console.warn("Failed to save recorder position:", err);
      }
    }
  };

  return (
    <ClickReelProvider>
      <AppContent
        recorderPosition={recorderPosition}
        onDragEnd={handleDragEnd}
      />
    </ClickReelProvider>
  );
}

export default App;
