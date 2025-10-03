/**
 * Main recorder component with floating UI
 * Draggable recorder with control buttons and status indicators
 */

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Circle,
  Square,
  Target,
  Plus,
  Download,
  Settings,
  GripVertical,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useRecorder } from "./hooks/useRecorder";
import { useClickReelContext } from "./context/ClickReelContext";

export interface ClickReelRecorderProps {
  /** The root element to capture */
  root?: HTMLElement;
  /** Current position (controlled by parent) */
  position?: { x: number; y: number };
  /** Whether the recorder is visible */
  visible?: boolean;
}

/**
 * The main recorder component with floating controls
 */
export function ClickReelRecorder({
  position = { x: window.innerWidth - 280, y: 20 },
  visible = true,
}: ClickReelRecorderProps) {
  const recorder = useRecorder();
  const { state } = useClickReelContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "click-reel-recorder",
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: "fixed" as const,
    top: position.y,
    left: position.x,
    zIndex: 999999,
    display: visible ? ("block" as const) : ("none" as const),
    pointerEvents: visible ? ("auto" as const) : ("none" as const),
  };

  // Get status color
  const getStatusColor = () => {
    switch (recorder.state) {
      case "recording":
        return "#ef4444"; // red
      case "armed":
        return "#f59e0b"; // amber
      case "processing":
        return "#3b82f6"; // blue
      case "exporting":
        return "#8b5cf6"; // purple
      default:
        return "#6b7280"; // gray
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (recorder.state) {
      case "recording":
        return "Recording";
      case "armed":
        return "Armed";
      case "processing":
        return "Processing";
      case "exporting":
        return "Exporting";
      default:
        return "Idle";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-screenshot-exclude="true"
      data-testid="click-reel-recorder"
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "12px",
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          minWidth: isCollapsed ? "auto" : "260px",
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            cursor: "grab",
          }}
          {...listeners}
          {...attributes}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <GripVertical size={16} color="#94a3b8" />
            <span
              style={{
                color: "#f1f5f9",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Click Reel
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>

        {/* Body - only show when not collapsed */}
        {!isCollapsed && (
          <div style={{ padding: "16px" }}>
            {/* Status Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: getStatusColor(),
                  boxShadow: `0 0 8px ${getStatusColor()}`,
                  animation:
                    recorder.state === "armed"
                      ? "pulse 1.5s ease-in-out infinite"
                      : "none",
                }}
              />
              <span style={{ color: "#e2e8f0", fontSize: "13px" }}>
                {getStatusText()}
              </span>
              {recorder.currentReel && (
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    marginLeft: "auto",
                  }}
                >
                  {recorder.currentReel.frames.length} frames
                </span>
              )}
            </div>

            {/* Control Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {/* Start/Stop Recording */}
              {recorder.state === "idle" ? (
                <button
                  onClick={() => recorder.startRecording()}
                  style={{
                    padding: "10px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    gridColumn: "span 2",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#dc2626")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#ef4444")
                  }
                  aria-label="Start Recording"
                >
                  <Circle size={16} fill="white" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={() => recorder.stopRecording()}
                  disabled={
                    recorder.state === "processing" ||
                    recorder.state === "exporting"
                  }
                  style={{
                    padding: "10px",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor:
                      recorder.state === "processing" ||
                      recorder.state === "exporting"
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    gridColumn: "span 2",
                    opacity:
                      recorder.state === "processing" ||
                      recorder.state === "exporting"
                        ? 0.5
                        : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (
                      recorder.state !== "processing" &&
                      recorder.state !== "exporting"
                    ) {
                      e.currentTarget.style.background = "#4b5563";
                    }
                  }}
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#6b7280")
                  }
                  aria-label="Stop Recording"
                >
                  <Square size={16} fill="white" />
                  Stop Recording
                </button>
              )}

              {/* Arm Capture */}
              <button
                onClick={() =>
                  recorder.state === "armed"
                    ? recorder.disarm()
                    : recorder.arm()
                }
                disabled={
                  recorder.state !== "recording" && recorder.state !== "armed"
                }
                style={{
                  padding: "10px",
                  background:
                    recorder.state === "armed" ? "#f59e0b" : "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    recorder.state === "recording" || recorder.state === "armed"
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  opacity:
                    recorder.state === "recording" || recorder.state === "armed"
                      ? 1
                      : 0.5,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (
                    recorder.state === "recording" ||
                    recorder.state === "armed"
                  ) {
                    e.currentTarget.style.background =
                      recorder.state === "armed" ? "#d97706" : "#1e293b";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background =
                    recorder.state === "armed" ? "#f59e0b" : "#334155";
                }}
                aria-label={
                  recorder.state === "armed" ? "Disarm" : "Arm Capture"
                }
              >
                <Target size={16} />
                Arm
              </button>

              {/* Add Frame */}
              <button
                onClick={() => recorder.addFrame()}
                disabled={recorder.state !== "recording"}
                style={{
                  padding: "10px",
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    recorder.state === "recording" ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  opacity: recorder.state === "recording" ? 1 : 0.5,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (recorder.state === "recording") {
                    e.currentTarget.style.background = "#1e293b";
                  }
                }}
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#334155")
                }
                aria-label="Add Frame"
              >
                <Plus size={16} />
                Frame
              </button>

              {/* Export */}
              <button
                onClick={() => {
                  if (recorder.currentReel?.id) {
                    recorder.exportReel(recorder.currentReel.id, "gif");
                  }
                }}
                disabled={
                  !recorder.currentReel ||
                  recorder.currentReel.frames.length === 0
                }
                style={{
                  padding: "10px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    recorder.currentReel &&
                    recorder.currentReel.frames.length > 0
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  gridColumn: "span 2",
                  opacity:
                    recorder.currentReel &&
                    recorder.currentReel.frames.length > 0
                      ? 1
                      : 0.5,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (
                    recorder.currentReel &&
                    recorder.currentReel.frames.length > 0
                  ) {
                    e.currentTarget.style.background = "#059669";
                  }
                }}
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#10b981")
                }
                aria-label="Export as GIF"
              >
                <Download size={16} />
                Export GIF
              </button>

              {/* Settings (placeholder) */}
              <button
                style={{
                  padding: "10px",
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  gridColumn: "span 2",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#e2e8f0";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#94a3b8";
                }}
                aria-label="Settings"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>

            {/* Loading indicator */}
            {(state.loading.capturing ||
              state.loading.encoding ||
              state.loading.saving) && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "6px",
                  color: "#93c5fd",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                {state.loading.capturing && "Capturing..."}
                {state.loading.encoding && "Encoding..."}
                {state.loading.saving && "Saving..."}
              </div>
            )}

            {/* Error indicator */}
            {state.error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "6px",
                  color: "#fca5a5",
                  fontSize: "11px",
                }}
              >
                {state.error.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
