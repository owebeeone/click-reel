/**
 * Delete confirmation dialog - confirms reel deletion
 */

import { AlertTriangle, X } from "lucide-react";

export interface DeleteConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close without deleting */
  onCancel: () => void;
  /** Callback to confirm deletion */
  onConfirm: () => void;
  /** Title of the reel being deleted */
  reelTitle: string;
  /** Number of frames in the reel */
  frameCount: number;
}

/**
 * Confirmation dialog for deleting reels
 */
export function DeleteConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  reelTitle,
  frameCount,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "2rem",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "100%",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} color="#ef4444" />
          </div>

          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "18px",
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              Delete Reel?
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete <strong>"{reelTitle}"</strong>?
            </p>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              color: "#64748b",
            }}
            title="Cancel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "14px",
                color: "#991b1b",
                fontWeight: 600,
              }}
            >
              This action cannot be undone
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.5rem",
                fontSize: "13px",
                color: "#991b1b",
                lineHeight: 1.6,
              }}
            >
              <li>
                All {frameCount} captured frames will be permanently deleted
              </li>
              <li>All metadata and event data will be lost</li>
              <li>The reel cannot be recovered after deletion</li>
            </ul>
          </div>

          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            If you're not sure, you can export the reel before deleting it.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#dc2626";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ef4444";
            }}
          >
            Delete Reel
          </button>
        </div>
      </div>
    </div>
  );
}
