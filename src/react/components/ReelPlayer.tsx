/**
 * Reel player modal - displays and plays back a saved reel
 */

import { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  ChevronLeft,
  ChevronRight,
  Bug,
} from "lucide-react";
import { CaptureDebugDialog } from "./CaptureDebugDialog";

/**
 * Frame format for the ReelPlayer
 */
export interface ReelPlayerFrame {
  id: string;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  clickEvent?: {
    x: number;
    y: number;
    elementPath: string;
    elementText?: string;
  };
}

export interface ReelPlayerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Reel title */
  title: string;
  /** Array of frames to play */
  frames: ReelPlayerFrame[];
  /** Playback speed in FPS (default: 1 for 1 second per frame) */
  fps?: number;
  /** Callback when export is requested */
  onExport?: (format: "gif" | "apng" | "zip") => void;
}

/**
 * Modal component for playing back captured reels
 */
export function ReelPlayer({
  isOpen,
  onClose,
  title,
  frames,
  fps = 1, // Default to 1 second per frame
  onExport,
}: ReelPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Stop playback when closing
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentFrame(0);
    }
  }, [isOpen]);

  // Handle playback
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => {
          const next = prev + 1;
          if (next >= frames.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000 / fps);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, frames.length, fps]);

  // No need for canvas - we'll use img directly for better capture compatibility

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentFrame((prev) => Math.max(0, prev - 1));
          setIsPlaying(false);
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentFrame((prev) => Math.min(frames.length - 1, prev + 1));
          setIsPlaying(false);
          break;
        case "Home":
          e.preventDefault();
          setCurrentFrame(0);
          setIsPlaying(false);
          break;
        case "End":
          e.preventDefault();
          setCurrentFrame(frames.length - 1);
          setIsPlaying(false);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "m":
          e.preventDefault();
          setShowMetadata((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, frames.length, onClose]);

  if (!isOpen || frames.length === 0) return null;

  const currentFrameData = frames[currentFrame];
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + "." + date.getMilliseconds();
  };

  return (
    <div
      className="pii-disable"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
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
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            {title}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setShowDiagnostics(true)}
              style={{
                background: "#f59e0b",
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "white",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
              }}
              title="Open Capture Diagnostics"
            >
              <Bug size={16} />
              Diagnostics
            </button>
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
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image viewer */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#f1f5f9", // Light gray for better contrast with captured images
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <img
            src={currentFrameData.dataUrl}
            alt={`Frame ${currentFrame + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />

          {/* Frame counter overlay */}
          <div
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "monospace",
            }}
          >
            Frame {currentFrame + 1} / {frames.length}
          </div>

          {/* Metadata overlay */}
          {showMetadata && currentFrameData && (
            <div
              style={{
                position: "absolute",
                bottom: "4rem",
                left: "1rem",
                background: "rgba(0, 0, 0, 0.9)",
                color: "white",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "monospace",
                maxWidth: "400px",
              }}
            >
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                Frame Metadata (press M to toggle)
              </div>
              <div>Time: {formatTimestamp(currentFrameData.timestamp)}</div>
              <div>
                Size: {currentFrameData.width}x{currentFrameData.height}
              </div>
              {currentFrameData.clickEvent && (
                <>
                  <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
                    Click Event:
                  </div>
                  <div>
                    Position: ({currentFrameData.clickEvent.x},{" "}
                    {currentFrameData.clickEvent.y})
                  </div>
                  <div>Target: {currentFrameData.clickEvent.elementPath}</div>
                  {currentFrameData.clickEvent.elementText && (
                    <div>Text: "{currentFrameData.clickEvent.elementText}"</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Timeline scrubber */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{ fontSize: "12px", color: "#64748b", minWidth: "40px" }}
            >
              {currentFrame + 1}
            </span>
            <input
              type="range"
              min="0"
              max={frames.length - 1}
              value={currentFrame}
              onChange={(e) => {
                setCurrentFrame(Number(e.target.value));
                setIsPlaying(false);
              }}
              style={{
                flex: 1,
                cursor: "pointer",
              }}
            />
            <span
              style={{ fontSize: "12px", color: "#64748b", minWidth: "40px" }}
            >
              {frames.length}
            </span>
          </div>

          {/* Playback controls */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => {
                setCurrentFrame(0);
                setIsPlaying(false);
              }}
              style={{
                padding: "8px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="First frame (Home)"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={() => {
                setCurrentFrame((prev) => Math.max(0, prev - 1));
                setIsPlaying(false);
              }}
              disabled={currentFrame === 0}
              style={{
                padding: "8px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                cursor: currentFrame === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                opacity: currentFrame === 0 ? 0.5 : 1,
              }}
              title="Previous frame (←)"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                padding: "12px 24px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
              }}
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button
              onClick={() => {
                setCurrentFrame((prev) =>
                  Math.min(frames.length - 1, prev + 1)
                );
                setIsPlaying(false);
              }}
              disabled={currentFrame === frames.length - 1}
              style={{
                padding: "8px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                cursor:
                  currentFrame === frames.length - 1
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                opacity: currentFrame === frames.length - 1 ? 0.5 : 1,
              }}
              title="Next frame (→)"
            >
              <ChevronRight size={20} />
            </button>

            <button
              onClick={() => {
                setCurrentFrame(frames.length - 1);
                setIsPlaying(false);
              }}
              style={{
                padding: "8px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Last frame (End)"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Export and metadata toggle */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              style={{
                padding: "8px 12px",
                background: showMetadata ? "#3b82f6" : "#f1f5f9",
                color: showMetadata ? "white" : "#475569",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
              title="Toggle metadata (M)"
            >
              {showMetadata ? "Hide" : "Show"} Metadata
            </button>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => onExport?.("gif")}
                style={{
                  padding: "8px 12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                }}
                title="Export as GIF"
              >
                <Download size={16} />
                Export GIF
              </button>
              <button
                onClick={() => onExport?.("apng")}
                style={{
                  padding: "8px 12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                }}
                title="Export as APNG"
              >
                <Download size={16} />
                Export APNG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics Dialog */}
      <CaptureDebugDialog
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
      />
    </div>
  );
}
