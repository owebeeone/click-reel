/**
 * Main recorder component with floating UI
 * Draggable recorder with control buttons and status indicators
 */

import { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
  Library,
  TestTube2,
} from "lucide-react";
import { useRecorder } from "./hooks/useRecorder";
import { useClickReelContext } from "./context/ClickReelContext";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ActionType } from "../types";
import {
  obfuscateInPlace,
  restoreObfuscation,
  DEFAULT_OBFUSCATION_CONFIG,
  type ObfuscationBackup,
} from "../utils/obfuscation";

export interface ClickReelRecorderProps {
  /** The root element to capture */
  root?: HTMLElement;
  /** Current position (controlled by parent) */
  position?: { x: number; y: number };
  /** Whether the recorder is visible */
  visible?: boolean;
  /** Initial collapsed state */
  initialCollapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Callback when inventory button is clicked */
  onInventoryClick?: () => void;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
}

/**
 * The main recorder component with floating controls
 */
export function ClickReelRecorder({
  position = { x: window.innerWidth - 280, y: 20 },
  visible: visibleProp,
  initialCollapsed = false,
  onCollapsedChange,
  onInventoryClick,
  onSettingsClick,
}: ClickReelRecorderProps) {
  const recorder = useRecorder();
  const { state, dispatch } = useClickReelContext();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  // Use context state for visibility if no prop is provided
  const visible =
    visibleProp !== undefined ? visibleProp : state.ui.recorderVisible;

  // Obfuscation preview state (debug tool)
  const [isObfuscating, setIsObfuscating] = useState(false);
  const [obfuscationBackup, setObfuscationBackup] =
    useState<ObfuscationBackup | null>(null);

  // Sync collapsed state with initialCollapsed prop changes
  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    {
      onToggleRecorder: () => {
        dispatch({
          type: ActionType.TOGGLE_RECORDER_UI,
        });
      },
      onToggleObfuscation: () => {
        console.log(
          "🔐 Toggling obfuscation from:",
          state.preferences.obfuscationEnabled,
          "to:",
          !state.preferences.obfuscationEnabled
        );
        dispatch({
          type: ActionType.UPDATE_PREFERENCES,
          payload: {
            obfuscationEnabled: !state.preferences.obfuscationEnabled,
          },
        });
      },
      onStartRecording: () => {
        console.log(
          "🎬 Start/Stop recording shortcut - recorder state:",
          recorder.state
        );
        if (recorder.state === "idle") {
          console.log("✅ Starting recording...");
          recorder.startRecording();
        } else if (recorder.state === "recording") {
          console.log("⏹️ Stopping recording...");
          recorder.stopRecording();
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
          recorder.addFrame();
        }
      },
      onToggleSettings: () => {
        dispatch({ type: ActionType.TOGGLE_SETTINGS });
        onSettingsClick?.();
      },
      onToggleInventory: () => {
        dispatch({ type: ActionType.TOGGLE_INVENTORY });
        onInventoryClick?.();
      },
    },
    state.preferences.keyboardShortcuts
  );

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

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
      className="pii-disable"
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
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "grab",
              flex: 1,
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            {...listeners}
            {...attributes}
          >
            <GripVertical
              size={16}
              color="#94a3b8"
              style={{ pointerEvents: "none" }}
            />
            <span
              style={{
                color: "#f1f5f9",
                fontSize: "14px",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              Click Reel
            </span>
          </div>
          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log("🔘 Minimize button clicked!");
                handleToggleCollapse();
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                position: "relative",
                zIndex: 10,
              }}
              aria-label="Minimize"
              title="Minimize recorder"
            >
              <Minimize2 size={16} />
            </button>
          )}
        </div>

        {/* Collapsed/Minimized View - icon-only controls */}
        {isCollapsed && (
          <div
            style={{
              padding: "8px",
              display: "flex",
              gap: "4px",
              flexWrap: "nowrap",
              alignItems: "center",
            }}
          >
            {/* Start/Stop Recording */}
            <button
              onClick={() => {
                if (recorder.state === "idle") {
                  recorder.startRecording();
                } else {
                  recorder.stopRecording();
                }
              }}
              disabled={recorder.state === "armed"}
              style={{
                padding: "8px",
                background:
                  recorder.state === "recording"
                    ? "#ef4444"
                    : recorder.state === "armed"
                      ? "#94a3b8"
                      : "#22c55e",
                border: "none",
                borderRadius: "6px",
                cursor: recorder.state === "armed" ? "not-allowed" : "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: recorder.state === "armed" ? 0.5 : 1,
              }}
              title={
                recorder.state === "recording"
                  ? "Stop Recording (Ctrl+Shift+S)"
                  : "Start Recording (Ctrl+Shift+S)"
              }
            >
              {recorder.state === "recording" ? (
                <Square size={16} fill="white" />
              ) : (
                <Circle size={16} />
              )}
            </button>

            {/* Arm/Disarm Capture */}
            <button
              onClick={() => {
                if (recorder.state === "armed") {
                  recorder.disarm();
                } else {
                  recorder.arm();
                }
              }}
              disabled={recorder.state === "idle"}
              style={{
                padding: "8px",
                background:
                  recorder.state === "armed"
                    ? "#f59e0b"
                    : recorder.state === "idle"
                      ? "#e2e8f0"
                      : "#64748b",
                border: "none",
                borderRadius: "6px",
                cursor: recorder.state === "idle" ? "not-allowed" : "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: recorder.state === "idle" ? 0.5 : 1,
              }}
              title={
                recorder.state === "armed"
                  ? "Disarm (Ctrl+Shift+A)"
                  : "Arm Capture (Ctrl+Shift+A)"
              }
            >
              <Target size={16} />
            </button>

            {/* Add Frame */}
            <button
              onClick={() => recorder.addFrame()}
              disabled={recorder.state === "idle"}
              style={{
                padding: "8px",
                background: recorder.state === "idle" ? "#e2e8f0" : "#64748b",
                border: "none",
                borderRadius: "6px",
                cursor: recorder.state === "idle" ? "not-allowed" : "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: recorder.state === "idle" ? 0.5 : 1,
              }}
              title="Add Frame (Ctrl+Shift+F)"
            >
              <Plus size={16} />
            </button>

            {/* Obfuscation Toggle */}
            <button
              onClick={() => {
                dispatch({ type: ActionType.TOGGLE_OBFUSCATION });
              }}
              style={{
                padding: "8px",
                background: state.ui?.obfuscationActive ? "#8b5cf6" : "#64748b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={
                state.ui?.obfuscationActive
                  ? "Disable Obfuscation"
                  : "Enable Obfuscation"
              }
            >
              {state.ui?.obfuscationActive ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>

            {/* Preview PII (Debug Tool) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                if (isObfuscating) {
                  // Restore original content
                  if (obfuscationBackup) {
                    restoreObfuscation(obfuscationBackup);
                    setObfuscationBackup(null);
                  }
                  setIsObfuscating(false);
                  console.log("🔓 Obfuscation preview disabled");
                } else {
                  // Apply obfuscation to live page
                  const backup = obfuscateInPlace(
                    document.documentElement,
                    DEFAULT_OBFUSCATION_CONFIG
                  );
                  setObfuscationBackup(backup);
                  setIsObfuscating(true);
                  console.log("🔒 Obfuscation preview enabled");
                }
              }}
              style={{
                padding: "8px",
                background: isObfuscating
                  ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                  : "#64748b",
                border: isObfuscating ? "2px solid #a78bfa" : "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={
                isObfuscating
                  ? "Restore original view"
                  : "Preview obfuscation (Debug tool)"
              }
            >
              <TestTube2 size={16} />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                dispatch({ type: ActionType.TOGGLE_SETTINGS });
                onSettingsClick?.();
              }}
              style={{
                padding: "8px",
                background: "#64748b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Settings (Ctrl+Shift+G)"
            >
              <Settings size={16} />
            </button>

            {/* Inventory */}
            <button
              onClick={() => {
                dispatch({ type: ActionType.TOGGLE_INVENTORY });
                onInventoryClick?.();
              }}
              style={{
                padding: "8px",
                background: "#64748b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Inventory (Ctrl+Shift+E)"
            >
              <Library size={16} />
            </button>

            {/* Expand button */}
            <button
              onClick={handleToggleCollapse}
              style={{
                padding: "8px",
                background: "#3b82f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Expand Recorder"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        )}

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
              <button
                onClick={() => {
                  dispatch({ type: ActionType.TOGGLE_OBFUSCATION });
                  console.log(
                    `Toggled obfuscation to: ${!state.ui?.obfuscationActive}`
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px",
                  background: state.ui?.obfuscationActive
                    ? "#8b5cf6"
                    : "#64748b",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title={
                  state.ui?.obfuscationActive
                    ? "Obfuscation enabled - Click to disable"
                    : "Obfuscation disabled - Click to enable"
                }
              >
                {state.ui?.obfuscationActive ? (
                  <EyeOff size={12} color="white" />
                ) : (
                  <Eye size={12} color="white" />
                )}
                <span
                  style={{
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {state.ui?.obfuscationActive ? "PRIVATE" : "PUBLIC"}
                </span>
              </button>
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

              {/* Preview Obfuscation (Debug Tool) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  if (isObfuscating) {
                    // Restore original content
                    if (obfuscationBackup) {
                      restoreObfuscation(obfuscationBackup);
                      setObfuscationBackup(null);
                    }
                    setIsObfuscating(false);
                    console.log("🔓 Obfuscation preview disabled");
                  } else {
                    // Apply obfuscation to live page
                    const backup = obfuscateInPlace(
                      document.documentElement,
                      DEFAULT_OBFUSCATION_CONFIG
                    );
                    setObfuscationBackup(backup);
                    setIsObfuscating(true);
                    console.log("🔒 Obfuscation preview enabled");
                  }
                }}
                style={{
                  padding: "10px",
                  background: isObfuscating
                    ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    : "#334155",
                  color: "white",
                  border: isObfuscating ? "2px solid #a78bfa" : "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  gridColumn: "span 2",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = isObfuscating
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                    : "#1e293b";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = isObfuscating
                    ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    : "#334155";
                }}
                title={
                  isObfuscating
                    ? "Click to restore original view"
                    : "Preview obfuscation (Debug tool)"
                }
              >
                <TestTube2 size={16} />
                {isObfuscating ? "Restore" : "Preview PII"}
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

              {/* Inventory */}
              <button
                onClick={() => {
                  dispatch({ type: ActionType.TOGGLE_INVENTORY });
                  onInventoryClick?.();
                }}
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
                aria-label="Inventory"
                title="View saved reels (Ctrl+Shift+E)"
              >
                <Library size={16} />
                Inventory
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  dispatch({ type: ActionType.TOGGLE_SETTINGS });
                  onSettingsClick?.();
                }}
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
                title="Open settings (Ctrl+Shift+G)"
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
