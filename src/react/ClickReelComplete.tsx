/**
 * Complete Click Reel integration with all features
 * Includes draggable recorder, settings, and inventory with automatic position management
 */

import { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ClickReelRecorder } from "./ClickReelRecorder";
import { ClickReelSettings } from "./ClickReelSettings";
import { ClickReelInventory } from "./ClickReelInventory";

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

  return {
    x: Math.max(minMargin, Math.min(pos.x, maxX)),
    y: Math.max(minMargin, Math.min(pos.y, maxY)),
  };
}

export interface ClickReelCompleteProps {
  /** Initial position of the recorder (default: top-right) */
  initialPosition?: { x: number; y: number };
  /** Whether the recorder should start minimized */
  startMinimized?: boolean;
}

/**
 * Complete Click Reel integration component
 *
 * Provides a fully-featured recorder with:
 * - Draggable, repositionable UI
 * - Automatic position persistence via localStorage
 * - Window resize handling with bounds checking
 * - Settings panel for user preferences
 * - Inventory management for saved recordings
 *
 * @example
 * ```tsx
 * import { ClickReelProvider, ClickReelComplete } from '@owebeeone/click-reel';
 *
 * function App() {
 *   return (
 *     <ClickReelProvider>
 *       <YourApp />
 *       <ClickReelComplete />
 *     </ClickReelProvider>
 *   );
 * }
 * ```
 */
export function ClickReelComplete({
  initialPosition,
  startMinimized = false,
}: ClickReelCompleteProps) {
  // Configure drag sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Manage recorder position state
  const [recorderPosition, setRecorderPosition] = useState(() => {
    try {
      const stored = localStorage.getItem("click-reel-position");
      const position = stored
        ? JSON.parse(stored)
        : initialPosition || { x: window.innerWidth - 300, y: 20 };

      // Sanitize the loaded position
      return sanitizeRecorderPosition(position);
    } catch {
      return sanitizeRecorderPosition(
        initialPosition || { x: window.innerWidth - 300, y: 20 }
      );
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

  // Handle drag end
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
    <>
      {/* Draggable recorder with DndContext */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <ClickReelRecorder
          position={recorderPosition}
          initialCollapsed={startMinimized}
        />
      </DndContext>

      {/* Settings and Inventory panels */}
      <ClickReelSettings />
      <ClickReelInventory />
    </>
  );
}
