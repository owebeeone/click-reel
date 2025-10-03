/**
 * Click Reel Demo Application
 */

import { useState } from "react";
import {
  ClickReelProvider,
  ClickReelRecorder,
  exportAndDownload,
  getStorageService,
  type Reel,
  type ExportFormat,
} from "../src";
import "./index.css";

function App() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("gif");
  const [storageInfo, setStorageInfo] = useState<string>("");

  // Create a mock reel for testing
  const createMockReel = (): Reel => {
    const now = Date.now();
    return {
      id: `demo-${now}`,
      title: "Demo Recording",
      description: "A test recording created in the playground",
      startTime: now,
      endTime: now + 1000,
      frames: [
        {
          id: `frame-1-${now}`,
          reelId: `demo-${now}`,
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          timestamp: now,
          order: 0,
          metadata: {
            viewportCoords: { x: 100, y: 100 },
            relativeCoords: { x: 50, y: 50 },
            elementPath: "button#demo",
            buttonType: 0,
            viewportSize: { width: 1920, height: 1080 },
            scrollPosition: { x: 0, y: 0 },
            captureType: "pre-click",
          },
        },
        {
          id: `frame-2-${now}`,
          reelId: `demo-${now}`,
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          timestamp: now + 500,
          order: 1,
          metadata: {
            viewportCoords: { x: 150, y: 150 },
            relativeCoords: { x: 75, y: 75 },
            elementPath: "button#demo",
            buttonType: 0,
            viewportSize: { width: 1920, height: 1080 },
            scrollPosition: { x: 0, y: 0 },
            captureType: "post-click",
          },
        },
      ],
      settings: {
        markerSize: 20,
        markerColor: "#ff0000",
        exportFormat: "gif",
        postClickDelay: 100,
        postClickInterval: 50,
        maxCaptureDuration: 5000,
        scale: 1,
        obfuscationEnabled: false,
      },
      metadata: {
        userAgent: navigator.userAgent,
        duration: 1000,
        clickCount: 1,
        viewportSize: { width: window.innerWidth, height: window.innerHeight },
        url: window.location.href,
      },
    };
  };

  const handleExport = async () => {
    const mockReel = createMockReel();

    try {
      await exportAndDownload(mockReel, {
        format: exportFormat,
        includeMetadata: true,
        includeHTML: exportFormat === "zip",
      });
      alert(`Successfully exported as ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      alert(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleSaveToStorage = async () => {
    const mockReel = createMockReel();
    const storage = getStorageService();

    try {
      await storage.init();
      await storage.saveReel(mockReel);
      await updateStorageInfo();
      alert("Reel saved to IndexedDB!");
    } catch (error) {
      alert(
        `Save failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const updateStorageInfo = async () => {
    const storage = getStorageService();
    try {
      await storage.init();
      const info = await storage.getStorageInfo();
      setStorageInfo(
        `Reels: ${info.reelsCount} | Frames: ${info.framesCount} | Size: ${(info.estimatedSize / 1024).toFixed(2)} KB`
      );
    } catch {
      setStorageInfo("Error loading storage info");
    }
  };

  const handleClearStorage = async () => {
    const storage = getStorageService();
    try {
      await storage.init();
      await storage.clearAll();
      await updateStorageInfo();
      alert("Storage cleared!");
    } catch (error) {
      alert(
        `Clear failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <ClickReelProvider>
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
          Test the click-reel library features
        </p>

        {/* Recorder Component */}
        <section
          style={{
            background: "#f9f9f9",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Recorder Component
          </h2>
          <ClickReelRecorder />
          <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
            Note: Full recorder functionality will be available in Phase 6+
          </p>
        </section>

        {/* Export Demo */}
        <section
          style={{
            background: "#f0f8ff",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Export Demo
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
              }}
            >
              <option value="gif">GIF</option>
              <option value="apng">APNG</option>
              <option value="zip">
                ZIP Bundle (GIF + APNG + Metadata + Viewer)
              </option>
            </select>
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Export Mock Reel as {exportFormat.toUpperCase()}
          </button>
          <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
            Exports a 2-frame test recording
          </p>
        </section>

        {/* Storage Demo */}
        <section
          style={{
            background: "#f0fff0",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            IndexedDB Storage Demo
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={handleSaveToStorage}
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
              Save Mock Reel to Storage
            </button>
            <button
              onClick={updateStorageInfo}
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
              Refresh Storage Info
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
        </section>

        {/* Interactive Test Area */}
        <section
          style={{
            background: "#fff9f0",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Interactive Test Area
          </h2>
          <p style={{ marginBottom: "1rem", color: "#666" }}>
            Click these elements to test interaction capture (Phase 2+):
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
            <li>✅ Phase 2: Event Management (Not integrated yet)</li>
            <li>✅ Phase 3: Encoding Services (GIF/APNG)</li>
            <li>✅ Phase 4: IndexedDB Storage</li>
            <li>✅ Phase 5: Export & Download</li>
            <li>🚧 Phase 6: React Context & State Management (Next)</li>
            <li>⏳ Phase 7-14: UI Components, Keyboard Shortcuts, etc.</li>
          </ul>
        </section>
      </div>
    </ClickReelProvider>
  );
}

export default App;
