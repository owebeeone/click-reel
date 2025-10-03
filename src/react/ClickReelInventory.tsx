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
  const [exportingReelId, setExportingReelId] = useState<string | null>(null);

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
    if (!storage || exportingReelId) return;

    try {
      setExportingReelId(reelId);
      const reel = await storage.loadReel(reelId);
      if (!reel) {
        throw new Error("Reel not found");
      }

      await exportReel(reel, {
        format,
        filename: reel.title,
        onProgress: (progress) => {
          console.log(`Export progress: ${Math.round(progress * 100)}%`);
        },
      });

      console.log(`✅ Exported ${reel.title} as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("❌ Failed to export reel:", error);
      alert(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setExportingReelId(null);
    }
  };

  const handleUpdateReelTitle = async (reelId: string, newTitle: string) => {
    if (!storage) return;

    try {
      await storage.updateReel(reelId, { title: newTitle });
      // Update local state
      setReels((prev) =>
        prev.map((r) => (r.id === reelId ? { ...r, title: newTitle } : r))
      );
      console.log(`✅ Updated reel title: "${newTitle}"`);
    } catch (error) {
      console.error("❌ Failed to update reel title:", error);
      alert(
        `Failed to update title: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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
          onUpdateReelTitle={handleUpdateReelTitle}
          exportingReelId={exportingReelId}
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

      {/* Export modal */}
      {exportingReelId && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e2e8f0",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                color: "#1e293b",
                fontWeight: 600,
              }}
            >
              Exporting reel...
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
              Please wait while we prepare your download
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
