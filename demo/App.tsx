/**
 * Click Reel Demo Application
 */

import { useState, useEffect, useRef } from "react";
import {
  ClickReelProvider,
  ClickReelComplete,
  useRecorder,
  useStorage,
  useClickReelContext,
} from "../src";
import toast, { Toaster } from "react-hot-toast";
import "./index.css";

function DemoContent() {
  const { state } = useClickReelContext();
  const recorder = useRecorder();
  const storage = useStorage();
  const [storageInfo, setStorageInfo] = useState<string>("");
  const [showTestDialog1, setShowTestDialog1] = useState(false);
  const [showTestDialog2, setShowTestDialog2] = useState(false);
  const [counterMs, setCounterMs] = useState(0);
  const [exportFormat, setExportFormat] = useState<"gif" | "apng" | "zip">(
    "gif"
  );

  // Toast notifications for state changes
  const prevRecorderVisible = useRef(state.ui.recorderVisible);
  const prevObfuscation = useRef(state.preferences.obfuscationEnabled);
  const prevSettingsVisible = useRef(state.ui.settingsVisible);
  const prevInventoryVisible = useRef(state.ui.inventoryVisible);
  const prevRecorderState = useRef(recorder.state);

  useEffect(() => {
    if (prevRecorderVisible.current !== state.ui.recorderVisible) {
      toast.success(
        `Recorder ${state.ui.recorderVisible ? "shown" : "hidden"}`,
        { duration: 2000 }
      );
      prevRecorderVisible.current = state.ui.recorderVisible;
    }
  }, [state.ui.recorderVisible]);

  useEffect(() => {
    if (prevObfuscation.current !== state.preferences.obfuscationEnabled) {
      toast.success(
        `Obfuscation ${state.preferences.obfuscationEnabled ? "enabled" : "disabled"}`,
        { duration: 2000 }
      );
      prevObfuscation.current = state.preferences.obfuscationEnabled;
    }
  }, [state.preferences.obfuscationEnabled]);

  useEffect(() => {
    if (prevSettingsVisible.current !== state.ui.settingsVisible) {
      toast.success(
        `Settings ${state.ui.settingsVisible ? "opened" : "closed"}`,
        { duration: 2000 }
      );
      prevSettingsVisible.current = state.ui.settingsVisible;
    }
  }, [state.ui.settingsVisible]);

  useEffect(() => {
    if (prevInventoryVisible.current !== state.ui.inventoryVisible) {
      toast.success(
        `Inventory ${state.ui.inventoryVisible ? "opened" : "closed"}`,
        { duration: 2000 }
      );
      prevInventoryVisible.current = state.ui.inventoryVisible;
    }
  }, [state.ui.inventoryVisible]);

  useEffect(() => {
    if (prevRecorderState.current !== recorder.state) {
      if (recorder.state === "recording") {
        toast.success("Recording started", { duration: 2000 });
      } else if (
        prevRecorderState.current === "recording" &&
        recorder.state === "idle"
      ) {
        toast.success("Recording stopped", { duration: 2000 });
      } else if (recorder.state === "armed") {
        toast.success("Capture armed - click to capture", { duration: 2000 });
      }
      prevRecorderState.current = recorder.state;
    }
  }, [recorder.state]);

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

  // Update storage info on mount and when inventory changes
  useEffect(() => {
    updateStorageInfo();
  }, [state.inventory]);

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

  // Handler functions for demo UI buttons
  const handleStartRecording = async () => {
    try {
      await recorder.startRecording();
    } catch (error) {
      toast.error(
        `Failed to start: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleAddFrame = async () => {
    try {
      await recorder.addFrame();
    } catch (error) {
      toast.error(
        `Failed to add frame: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      await recorder.stopRecording();
    } catch (error) {
      toast.error(
        `Failed to stop: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleExport = async (reelId?: string) => {
    const targetReelId = reelId || recorder.currentReel?.id;
    if (!targetReelId) {
      toast.error("No reel to export!");
      return;
    }
    try {
      await recorder.exportReel(targetReelId, exportFormat);
      toast.success(`Exported as ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      toast.error(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`
      );
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
          Obfuscation{" "}
          {state.preferences.obfuscationEnabled ? "Enabled" : "Disabled"}
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
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
          }}
        >
          <p style={{ color: "#666", fontSize: "1rem", marginBottom: "1rem" }}>
            <strong>ClickReelComplete</strong> provides a floating recorder
            panel with built-in inventory.
          </p>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            Press{" "}
            <code
              style={{
                background: "#e9ecef",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              Ctrl+Shift+E
            </code>{" "}
            to open the Inventory Panel, or click the inventory button on the
            floating recorder panel.
          </p>
        </div>
      </section>

      {/* Settings */}
      <section style={{ marginTop: "2rem" }}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            color: "#1e293b",
          }}
        >
          ⚙️ Settings
        </h2>
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
          }}
        >
          <p style={{ color: "#666", fontSize: "1rem", marginBottom: "1rem" }}>
            <strong>ClickReelComplete</strong> provides a floating recorder
            panel with built-in settings.
          </p>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            Press{" "}
            <code
              style={{
                background: "#e9ecef",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              Ctrl+Shift+G
            </code>{" "}
            to open the Settings Panel, or click the settings button on the
            floating recorder panel.
          </p>
        </div>
      </section>

      {/* ClickReelComplete provides Settings and Inventory panels - no manual UI needed */}

      {/* Test Dialog 1 - Static */}
      {showTestDialog1 && (
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

function AppContent() {
  return (
    <div>
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
      <DemoContent />
      {/* ClickReelComplete handles all recorder, settings, and inventory UI */}
      <ClickReelComplete />
    </div>
  );
}

function App() {
  return (
    <ClickReelProvider>
      <AppContent />
    </ClickReelProvider>
  );
}

export default App;
