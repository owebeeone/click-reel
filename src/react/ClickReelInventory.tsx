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
import { exportReel, downloadBlob } from "../core/export";
import { ActionType } from "../types";
import type { ReelSummary, Frame } from "../types";
import { X } from "lucide-react";

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
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
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
          metadata: {
            viewportCoords: frame.metadata.viewportCoords,
            scrollPosition: frame.metadata.scrollPosition,
            markerCoords: frame.metadata.markerCoords,
            viewportSize: frame.metadata.viewportSize,
          },
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

      const result = await exportReel(reel, {
        format,
        filename: reel.title,
        onProgress: (current, total, message) => {
          const percent = Math.round((current / total) * 100);
          console.log(`Export progress: ${percent}% - ${message || ""}`);
        },
      });

      // Download the file
      downloadBlob(result.blob, result.filename);

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

  const handleDeleteAll = async () => {
    if (!storage || reels.length === 0) return;

    try {
      // Delete all reels
      await Promise.all(reels.map((reel) => storage.deleteReel(reel.id)));
      setReels([]);
      setShowDeleteAllConfirm(false);
      console.log(`✅ Deleted all ${reels.length} reels`);
    } catch (error) {
      console.error("❌ Failed to delete all reels:", error);
      alert(
        `Failed to delete all reels: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleClosePlayer = () => {
    setViewingReelId(null);
    setViewingReelFrames([]);
    setViewingReelTitle("");
  };

  // Don't render if not visible
  if (!context?.state.ui.inventoryVisible) {
    return null;
  }

  return (
    <div
      className="pii-disable"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(4px)",
      }}
      onClick={() => {
        // Close inventory when clicking outside
        if (context) {
          context.dispatch({ type: ActionType.TOGGLE_INVENTORY });
        }
      }}
    >
      <div
        className={className}
        style={{
          ...style,
          width: "90%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          margin: 0,
          padding: "2rem",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Click Reel Inventory
          </h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {reels.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                }}
              >
                Remove All
              </button>
            )}
            <button
              onClick={() => {
                if (context) {
                  context.dispatch({ type: ActionType.TOGGLE_INVENTORY });
                }
              }}
              style={{
                padding: "8px",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#1e293b";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#64748b";
              }}
              aria-label="Close inventory"
            >
              <X size={20} />
            </button>
          </div>
        </div>

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

        {/* Delete All Confirmation Dialog */}
        {showDeleteAllConfirm && (
          <div
            className="pii-disable"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
            onClick={() => setShowDeleteAllConfirm(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "2rem",
                maxWidth: "400px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Delete All Reels?
              </h2>
              <p
                style={{
                  margin: "0 0 1.5rem 0",
                  color: "#64748b",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                Are you sure you want to delete all{" "}
                <strong>{reels.length}</strong> saved reel
                {reels.length !== 1 ? "s" : ""}? This action cannot be undone.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  style={{
                    padding: "8px 16px",
                    background: "#ef4444",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export modal */}
        {exportingReelId && (
          <div
            className="pii-disable"
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
    </div>
  );
}
