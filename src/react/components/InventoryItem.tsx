/**
 * Inventory item component - displays individual reel card
 */

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import type { ReelSummary } from "../../types";

export interface InventoryItemProps {
  /** Reel summary data */
  reel: ReelSummary;
  /** Callback when view/play is clicked */
  onView?: () => void;
  /** Callback when export is requested */
  onExport?: (format: "gif" | "apng" | "zip") => void;
  /** Callback when delete is requested */
  onDelete?: () => void;
  /** Whether export is in progress */
  isExporting?: boolean;
}

/**
 * Individual reel card with thumbnail and actions
 */
export function InventoryItem({
  reel,
  onView,
  onExport,
  onDelete,
  isExporting = false,
}: InventoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(reel.title);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showExportMenu]);

  const handleSaveTitle = () => {
    // TODO: Implement title update in storage
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(reel.title);
    setIsEditing(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today " + date.toLocaleTimeString();
    } else if (days === 1) {
      return "Yesterday " + date.toLocaleTimeString();
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = () => {
    const durationMs = (reel.endTime || Date.now()) - reel.startTime;
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        transition: "box-shadow 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: "120px",
          height: "90px",
          flexShrink: 0,
          background: "#f1f5f9",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={onView}
      >
        {reel.thumbnailUrl ? (
          <img
            src={reel.thumbnailUrl}
            alt={reel.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <ImageIcon size={32} color="#cbd5e1" />
        )}
        {/* Play overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = "0";
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={20} color="#3b82f6" fill="#3b82f6" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        {isEditing ? (
          <div
            style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
          >
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              style={{
                flex: 1,
                padding: "4px 8px",
                border: "1px solid #3b82f6",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: 600,
                outline: "none",
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <button
              onClick={handleSaveTitle}
              style={{
                padding: "4px 8px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                padding: "4px 8px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#1e293b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {reel.title}
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
              }}
              title="Edit title"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}

        {/* Description */}
        {reel.description && (
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "14px",
              color: "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {reel.description}
          </p>
        )}

        {/* Metadata */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            fontSize: "13px",
            color: "#94a3b8",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={14} />
            {formatDate(reel.startTime)}
          </span>
          <span>{formatDuration()}</span>
          <span>
            {reel.frameCount} frame{reel.frameCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <button
          onClick={onView}
          style={{
            padding: "8px 12px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: 500,
          }}
          title="View reel"
        >
          <Play size={16} />
          View
        </button>

        {/* Export dropdown */}
        <div style={{ position: "relative" }} ref={exportMenuRef}>
          <button
            onClick={() => !isExporting && setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            style={{
              padding: "8px 12px",
              background: isExporting ? "#e2e8f0" : "#f1f5f9",
              color: isExporting ? "#94a3b8" : "#475569",
              border: "none",
              borderRadius: "6px",
              cursor: isExporting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 500,
              opacity: isExporting ? 0.6 : 1,
            }}
            title={isExporting ? "Export in progress..." : "Export reel"}
          >
            {isExporting ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #94a3b8",
                    borderTopColor: "transparent",
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
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>

          {showExportMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
                minWidth: "120px",
              }}
            >
              <button
                onClick={() => {
                  onExport?.("gif");
                  setShowExportMenu(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Export as GIF
              </button>
              <button
                onClick={() => {
                  onExport?.("apng");
                  setShowExportMenu(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Export as APNG
              </button>
              <button
                onClick={() => {
                  onExport?.("zip");
                  setShowExportMenu(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  borderTop: "1px solid #e2e8f0",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Export as ZIP
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          style={{
            padding: "8px",
            background: "transparent",
            color: "#ef4444",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          title="Delete reel"
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
