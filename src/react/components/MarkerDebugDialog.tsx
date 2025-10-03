/**
 * Debug dialog for marker positioning - helps diagnose coordinate transformations
 */

import { useState, useRef } from "react";
import { X, Copy, Check } from "lucide-react";

export interface MarkerDebugDialogProps {
  isOpen: boolean;
  onClose: () => void;
  frameDataUrl: string;
  originalClickX: number;
  originalClickY: number;
  viewportCoords: { x: number; y: number };
  scrollPosition: { x: number; y: number };
  markerCoords: { x: number; y: number };
  captureWidth: number;
  captureHeight: number;
}

export function MarkerDebugDialog({
  isOpen,
  onClose,
  frameDataUrl,
  originalClickX,
  originalClickY,
  viewportCoords,
  scrollPosition,
  markerCoords,
  captureWidth,
  captureHeight,
}: MarkerDebugDialogProps) {
  const [clickedX, setClickedX] = useState<number | null>(null);
  const [clickedY, setClickedY] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setClickedX(Math.round(x));
    setClickedY(Math.round(y));
  };

  const debugInfo = {
    original_click: {
      viewport_x: viewportCoords.x,
      viewport_y: viewportCoords.y,
      page_x: originalClickX,
      page_y: originalClickY,
    },
    scroll_position: {
      x: scrollPosition.x,
      y: scrollPosition.y,
    },
    marker_position_used: {
      x: markerCoords.x,
      y: markerCoords.y,
    },
    capture_dimensions: {
      width: captureWidth,
      height: captureHeight,
    },
    clicked_on_image: {
      x: clickedX,
      y: clickedY,
    },
    difference: clickedX !== null && clickedY !== null ? {
      x_diff: clickedX - viewportCoords.x,
      y_diff: clickedY - viewportCoords.y,
    } : null,
    calculations: {
      viewport_plus_scroll: {
        x: viewportCoords.x + scrollPosition.x,
        y: viewportCoords.y + scrollPosition.y,
      },
      marker_minus_viewport: {
        x: markerCoords.x - viewportCoords.x,
        y: markerCoords.y - viewportCoords.y,
      },
      marker_minus_scroll: {
        x: markerCoords.x - scrollPosition.x,
        y: markerCoords.y - scrollPosition.y,
      },
    },
  };

  const handleCopy = () => {
    const text = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "2rem",
        overflow: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          maxWidth: "95vw",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          gap: "1rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: "400px",
          }}
        >
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
              🐛 Marker Debug Tool
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                ref={imgRef}
                src={frameDataUrl}
                alt="Captured frame"
                onClick={handleImageClick}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  cursor: "crosshair",
                  border: "2px solid #3b82f6",
                }}
              />
              {clickedX !== null && clickedY !== null && imgRef.current && (
                <div
                  style={{
                    position: "absolute",
                    left: `${(clickedX / imgRef.current.naturalWidth) * 100}%`,
                    top: `${(clickedY / imgRef.current.naturalHeight) * 100}%`,
                    width: "20px",
                    height: "20px",
                    border: "3px solid #10b981",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: "14px",
              color: "#475569",
            }}
          >
            <strong>Instructions:</strong> Click on the image where you originally
            clicked (where the marker should appear). The green circle shows your
            click.
          </div>
        </div>

        {/* Debug info side */}
        <div
          style={{
            width: "450px",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
              Debug Information
            </h3>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                background: copied ? "#10b981" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
              }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy JSON
                </>
              )}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "1.5rem",
            }}
          >
            <pre
              style={{
                margin: 0,
                fontSize: "12px",
                fontFamily: "monospace",
                lineHeight: 1.6,
                background: "#f1f5f9",
                padding: "1rem",
                borderRadius: "6px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(debugInfo, null, 2)}
            </pre>

            {clickedX !== null && clickedY !== null && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "#dbeafe",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  📊 Analysis:
                </div>
                <div>
                  Expected marker at: ({viewportCoords.x}, {viewportCoords.y})
                </div>
                <div>
                  You clicked at: ({clickedX}, {clickedY})
                </div>
                <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
                  Offset: ({clickedX - viewportCoords.x},{" "}
                  {clickedY - viewportCoords.y})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

