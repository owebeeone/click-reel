/**
 * Capture Debug Dialog - helps diagnose capture issues
 */

import { useState, useEffect } from "react";

interface CaptureEvent {
  timestamp: number;
  event: string;
  details: string;
  data?: any;
}

interface CaptureDebugDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaptureDebugDialog({
  isOpen,
  onClose,
}: CaptureDebugDialogProps) {
  const [events, setEvents] = useState<CaptureEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Intercept console.log to capture events
    const originalLog = console.log;
    const logEvent = (event: string, details: string, data?: any) => {
      setEvents((prev) => [
        ...prev,
        { timestamp: Date.now(), event, details, data },
      ]);
    };

    // Monitor for capture-related console logs
    console.log = (...args: any[]) => {
      originalLog(...args);
      const message = args.join(" ");
      if (
        message.includes("Capturing") ||
        message.includes("Capture") ||
        message.includes("screenshot")
      ) {
        logEvent("Console Log", message, args);
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, [isOpen]);

  const runDiagnostics = async () => {
    setEvents([]);
    setIsMonitoring(true);

    const log = (event: string, details: string, data?: any) => {
      setEvents((prev) => [
        ...prev,
        { timestamp: Date.now(), event, details, data },
      ]);
    };

    log("START", "Beginning diagnostic sequence");

    // Check viewport
    log("VIEWPORT", "Current viewport size", {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    });

    // Find all modals/overlays
    const modals = Array.from(
      document.querySelectorAll('[style*="position: fixed"]')
    );
    log("MODALS", `Found ${modals.length} fixed position elements`, {
      count: modals.length,
      elements: modals.map((m) => ({
        tagName: m.tagName,
        id: (m as HTMLElement).id,
        className: (m as HTMLElement).className,
        zIndex: window.getComputedStyle(m as HTMLElement).zIndex,
        visible:
          window.getComputedStyle(m as HTMLElement).visibility !== "hidden",
        display: window.getComputedStyle(m as HTMLElement).display,
      })),
    });

    // Find images in the DOM
    const images = Array.from(document.querySelectorAll("img"));
    log("IMAGES", `Found ${images.length} img elements`, {
      count: images.length,
      images: images.slice(0, 5).map((img) => ({
        src: img.src.substring(0, 100),
        visible: window.getComputedStyle(img).visibility !== "hidden",
        display: window.getComputedStyle(img).display,
        width: img.offsetWidth,
        height: img.offsetHeight,
        zIndex: window.getComputedStyle(img).zIndex,
      })),
    });

    // Check for excluded elements
    const excluded = Array.from(
      document.querySelectorAll("[data-screenshot-exclude]")
    );
    log("EXCLUDED", `Found ${excluded.length} excluded elements`, {
      count: excluded.length,
      elements: excluded.map((el) => ({
        tagName: (el as HTMLElement).tagName,
        id: (el as HTMLElement).id,
        className: (el as HTMLElement).className,
      })),
    });

    // Simulate a capture timing test
    log("TIMING", "Testing capture timing...");

    const beforeSnapshot = {
      modalsVisible: modals.filter(
        (m) => window.getComputedStyle(m as HTMLElement).display !== "none"
      ).length,
      imagesVisible: images.filter(
        (img) => window.getComputedStyle(img).display !== "none"
      ).length,
    };
    log("BEFORE_CAPTURE", "State before simulated capture", beforeSnapshot);

    // Wait 100ms (simulating capture delay)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const afterSnapshot = {
      modalsVisible: modals.filter(
        (m) => window.getComputedStyle(m as HTMLElement).display !== "none"
      ).length,
      imagesVisible: images.filter(
        (img) => window.getComputedStyle(img).display !== "none"
      ).length,
    };
    log("AFTER_CAPTURE", "State after simulated capture", afterSnapshot);

    // Check if state changed
    if (
      beforeSnapshot.modalsVisible !== afterSnapshot.modalsVisible ||
      beforeSnapshot.imagesVisible !== afterSnapshot.imagesVisible
    ) {
      log("WARNING", "DOM state changed during capture delay!", {
        modalsDiff: afterSnapshot.modalsVisible - beforeSnapshot.modalsVisible,
        imagesDiff: afterSnapshot.imagesVisible - beforeSnapshot.imagesVisible,
      });
    }

    // Check document.documentElement capture readiness
    const root = document.documentElement;
    log("ROOT_ELEMENT", "Checking capture root", {
      tagName: root.tagName,
      offsetWidth: root.offsetWidth,
      offsetHeight: root.offsetHeight,
      scrollWidth: root.scrollWidth,
      scrollHeight: root.scrollHeight,
      childElementCount: root.childElementCount,
    });

    log("COMPLETE", "Diagnostic sequence complete");
    setIsMonitoring(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
  };

  const getEventColor = (event: string) => {
    if (event === "WARNING") return "#ef4444";
    if (event === "START" || event === "COMPLETE") return "#3b82f6";
    if (event.includes("CAPTURE")) return "#8b5cf6";
    return "#64748b";
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
        zIndex: 2000000, // Higher than modals to see everything
        padding: "2rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          width: "800px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
            🔍 Capture Diagnostics
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            &times;
          </button>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <button
            onClick={runDiagnostics}
            disabled={isMonitoring}
            style={{
              padding: "8px 16px",
              background: isMonitoring ? "#94a3b8" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isMonitoring ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isMonitoring ? "Running..." : "Run Diagnostics"}
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(events, null, 2);
              navigator.clipboard.writeText(data).then(() => {
                alert("Diagnostic data copied to clipboard!");
              });
            }}
            disabled={events.length === 0}
            style={{
              padding: "8px 16px",
              background: events.length === 0 ? "#94a3b8" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: events.length === 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            📋 Copy All
          </button>
          <button
            onClick={() => setEvents([])}
            style={{
              padding: "8px 16px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            {events.length} events logged
          </span>
        </div>

        {/* Event log */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem 1.5rem",
            background: "#f8fafc",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          {events.length === 0 ? (
            <div
              style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}
            >
              No events yet. Click "Run Diagnostics" to start.
            </div>
          ) : (
            events.map((event, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "white",
                  borderRadius: "6px",
                  borderLeft: `4px solid ${getEventColor(event.event)}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <strong style={{ color: getEventColor(event.event) }}>
                    {event.event}
                  </strong>
                  <span style={{ color: "#94a3b8" }}>
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <div style={{ color: "#475569", marginBottom: "0.5rem" }}>
                  {event.details}
                </div>
                {event.data && (
                  <pre
                    style={{
                      background: "#f1f5f9",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      overflow: "auto",
                      maxHeight: "200px",
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
