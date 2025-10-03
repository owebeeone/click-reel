/**
 * Inventory viewer component for saved reels
 */

import { useState, useEffect } from "react";
import { InventoryList } from "./components/InventoryList";
import { ReelPlayer } from "./components/ReelPlayer";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { EmptyState } from "./components/EmptyState";
import { useStorage } from "./hooks/useStorage";
import { useClickReelContext } from "./context/ClickReelContext";
import { StorageService } from "../core/storage";
import { exportReel } from "../core/export";
import type { ReelSummary, Frame } from "../types";

export interface ClickReelInventoryProps {
  /** Storage service instance to use */
  storageService?: StorageService;
  /** Callback when recording is requested */
  onStartRecording?: () => void;
  /** Custom className for styling */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Frame format for the ReelPlayer
 */
interface ReelPlayerFrame {
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

/**
 * Component for viewing and managing saved reels
 */
export function ClickReelInventory({
  storageService: customStorageService,
  onStartRecording,
  className,
  style,
}: ClickReelInventoryProps) {
  const storageHook = useStorage();
  const storage = customStorageService || storageHook;
  const context = useClickReelContext();

  const [reels, setReels] = useState<ReelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReelId, setViewingReelId] = useState<string | null>(null);
  const [viewingReelFrames, setViewingReelFrames] = useState<ReelPlayerFrame[]>(
    []
  );
  const [viewingReelTitle, setViewingReelTitle] = useState("");
  const [deletingReel, setDeletingReel] = useState<ReelSummary | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load reels on mount
  useEffect(() => {
    loadReels();
  }, []);

  // Sync with context inventory changes (when recordings are saved)
  useEffect(() => {
    if (context?.state.inventory && context.state.inventory.length > 0) {
      setReels(context.state.inventory);
    }
  }, [context?.state.inventory]);

  const loadReels = async () => {
    if (!storage) return;

    try {
      setLoading(true);
      const summaries =
        "loadInventory" in storage
          ? await storage.loadInventory()
          : await storage.loadAllReels();
      setReels(summaries);
    } catch (error) {
      console.error("Failed to load reels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReel = async (reelId: string) => {
    if (!storage) return;

    try {
      const reel = await storage.loadReel(reelId);
      if (!reel) return;

      // Convert frames to ReelPlayerFrame format
      const capturedFrames: ReelPlayerFrame[] = reel.frames.map(
        (frame: Frame) => ({
          id: frame.id,
          dataUrl:
            typeof frame.image === "string"
              ? frame.image
              : URL.createObjectURL(frame.image),
          timestamp: frame.timestamp,
          width: frame.metadata.viewportSize.width,
          height: frame.metadata.viewportSize.height,
          clickEvent: {
            x: frame.metadata.viewportCoords.x,
            y: frame.metadata.viewportCoords.y,
            elementPath: frame.metadata.elementPath,
            elementText: undefined, // Not stored in current Frame type
          },
        })
      );

      setViewingReelId(reelId);
      setViewingReelFrames(capturedFrames);
      setViewingReelTitle(reel.title);
    } catch (error) {
      console.error("Failed to load reel:", error);
    }
  };

  const handleExportReel = async (
    reelId: string,
    format: "gif" | "apng" | "zip"
  ) => {
    if (!storage || exporting) return;

    try {
      setExporting(true);
      const reel = await storage.loadReel(reelId);
      if (!reel) return;

      await exportReel(reel, {
        format,
        filename: reel.title,
      });

      console.log(`Exported ${reel.title} as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Failed to export reel:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteReel = async () => {
    if (!storage || !deletingReel) return;

    try {
      await storage.deleteReel(deletingReel.id);
      setReels((prev) => prev.filter((r) => r.id !== deletingReel.id));
      setDeletingReel(null);
      console.log(`Deleted reel: ${deletingReel.title}`);
    } catch (error) {
      console.error("Failed to delete reel:", error);
    }
  };

  const handleClosePlayer = () => {
    setViewingReelId(null);
    setViewingReelFrames([]);
    setViewingReelTitle("");
  };

  return (
    <div
      className={className}
      style={{
        ...style,
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          margin: "0 0 2rem 0",
          fontSize: "32px",
          fontWeight: 700,
          color: "#1e293b",
        }}
      >
        Click Reel Inventory
      </h1>

      {reels.length === 0 && !loading ? (
        <EmptyState onStartRecording={onStartRecording} />
      ) : (
        <InventoryList
          reels={reels}
          loading={loading}
          onViewReel={handleViewReel}
          onExportReel={handleExportReel}
          onDeleteReel={(reelId) => {
            const reel = reels.find((r) => r.id === reelId);
            if (reel) setDeletingReel(reel);
          }}
        />
      )}

      {/* Reel Player Modal */}
      <ReelPlayer
        isOpen={viewingReelId !== null}
        onClose={handleClosePlayer}
        title={viewingReelTitle}
        frames={viewingReelFrames}
        fps={1}
        onExport={(format) => {
          if (viewingReelId) {
            handleExportReel(viewingReelId, format);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deletingReel && (
        <DeleteConfirmDialog
          isOpen={true}
          onCancel={() => setDeletingReel(null)}
          onConfirm={handleDeleteReel}
          reelTitle={deletingReel.title}
          frameCount={deletingReel.frameCount}
        />
      )}

      {/* Export indicator */}
      {exporting && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            padding: "1rem 1.5rem",
            background: "#3b82f6",
            color: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontSize: "14px",
            fontWeight: 500,
            zIndex: 999,
          }}
        >
          Exporting...
        </div>
      )}
    </div>
  );
}
