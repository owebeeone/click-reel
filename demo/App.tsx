/**
 * Click Reel Demo Application
 */

import { useState } from "react";
import {
  ClickReelProvider,
  ClickReelRecorder,
  useRecorder,
  useStorage,
  useClickReelContext,
  type ExportFormat,
} from "../src";
import { useKeyboardShortcuts } from "../src/react/hooks/useKeyboardShortcuts";
import toast, { Toaster } from "react-hot-toast";
import "./index.css";

function DemoContent() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("gif");
  const { state } = useClickReelContext();
  const recorder = useRecorder();
  const storage = useStorage();
  const [storageInfo, setStorageInfo] = useState<string>("");
  const [recorderVisible, setRecorderVisible] = useState(true);
  const [obfuscationEnabled, setObfuscationEnabled] = useState(false);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onToggleRecorder: () => {
      const newVisible = !recorderVisible;
      setRecorderVisible(newVisible);
      toast.success(`Recorder ${newVisible ? "shown" : "hidden"}`, {
        duration: 5000,
      });
    },
    onToggleObfuscation: () => {
      const newObfuscation = !obfuscationEnabled;
      setObfuscationEnabled(newObfuscation);
      toast.success(`Obfuscation ${newObfuscation ? "enabled" : "disabled"}`, {
        duration: 5000,
      });
    },
    onStartRecording: () => {
      if (recorder.state === "idle") {
        handleStartRecording();
      }
    },
    onStopRecording: () => {
      if (recorder.state === "recording" || recorder.state === "armed") {
        handleStopRecording();
      }
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
      {recorderVisible && <ClickReelRecorder />}

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
            <code>Ctrl+Shift+S</code> - Start Recording
          </div>
          <div>
            <code>Ctrl+Shift+X</code> - Stop Recording
          </div>
          <div>
            <code>Ctrl+Shift+A</code> - Arm Capture (when recording)
          </div>
          <div>
            <code>Ctrl+Shift+F</code> - Add Frame (when recording)
          </div>
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "12px", color: "#666" }}>
          Status: Recorder {recorderVisible ? "Visible" : "Hidden"} |
          Obfuscation {obfuscationEnabled ? "Enabled" : "Disabled"}
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

      {/* Recorder Component */}
      <section
        style={{
          background: "#fff3e0",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Recorder UI Component
        </h2>
        <ClickReelRecorder />
        <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
          Note: Full UI will be available in Phase 7
        </p>
      </section>

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
            onClick={() => console.log("Button 1 clicked")}
          >
            Test Button 1
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
            onClick={() => console.log("Button 2 clicked")}
          >
            Test Button 2
          </button>
          <input
            type="text"
            placeholder="Type here..."
            style={{
              padding: "1rem",
              fontSize: "1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      </section>

      {/* Feature Status */}
      <section
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Implementation Status
        </h2>
        <ul style={{ lineHeight: "1.8" }}>
          <li>✅ Phase 0: Project Setup & TypeScript Config</li>
          <li>✅ Phase 1: Core Capture Engine</li>
          <li>✅ Phase 2: Event Management (Standalone)</li>
          <li>✅ Phase 3: Encoding Services (GIF/APNG)</li>
          <li>✅ Phase 4: IndexedDB Storage</li>
          <li>✅ Phase 5: Export & Download</li>
          <li>✅ Phase 6: React Context & State Management</li>
          <li>🚧 Phase 7: Recorder UI Components (Next)</li>
          <li>⏳ Phase 8-14: Advanced Features</li>
        </ul>
      </section>
    </div>
  );
}

function App() {
  return (
    <ClickReelProvider>
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
    </ClickReelProvider>
  );
}

export default App;
