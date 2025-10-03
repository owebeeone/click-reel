/**
 * Inventory list component - displays all saved reels
 */

import { useState, useMemo } from "react";
import { Search, SortAsc, SortDesc } from "lucide-react";
import type { ReelSummary } from "../../types";
import { InventoryItem } from "./InventoryItem";

export interface InventoryListProps {
  /** Array of reel summaries to display */
  reels: ReelSummary[];
  /** Callback when a reel is selected for viewing */
  onViewReel?: (reelId: string) => void;
  /** Callback when a reel should be exported */
  onExportReel?: (reelId: string, format: "gif" | "apng" | "zip") => void;
  /** Callback when a reel should be deleted */
  onDeleteReel?: (reelId: string) => void;
  /** Whether reels are currently loading */
  loading?: boolean;
}

type SortField = "date" | "title" | "frames";
type SortOrder = "asc" | "desc";

/**
 * Inventory list component with search, sort, and filter
 */
export function InventoryList({
  reels,
  onViewReel,
  onExportReel,
  onDeleteReel,
  loading = false,
}: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filter and sort reels
  const filteredAndSortedReels = useMemo(() => {
    let filtered = reels;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = reels.filter(
        (reel) =>
          reel.title.toLowerCase().includes(query) ||
          reel.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = a.startTime - b.startTime;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "frames":
          comparison = a.frameCount - b.frameCount;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [reels, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Header with search and sort */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search reels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
        </div>

        {/* Sort buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <SortButton
            label="Date"
            active={sortField === "date"}
            order={sortOrder}
            onClick={() => toggleSort("date")}
          />
          <SortButton
            label="Title"
            active={sortField === "title"}
            order={sortOrder}
            onClick={() => toggleSort("title")}
          />
          <SortButton
            label="Frames"
            active={sortField === "frames"}
            order={sortOrder}
            onClick={() => toggleSort("frames")}
          />
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "14px", color: "#64748b" }}>
        {loading ? (
          "Loading..."
        ) : (
          <>
            Showing {filteredAndSortedReels.length} of {reels.length} reel
            {reels.length !== 1 ? "s" : ""}
          </>
        )}
      </div>

      {/* Reel list */}
      {loading ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          Loading reels...
        </div>
      ) : filteredAndSortedReels.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          {searchQuery ? (
            <>
              No reels found matching "{searchQuery}"
              <br />
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              No reels yet
              <br />
              <span style={{ fontSize: "12px", marginTop: "0.5rem" }}>
                Start recording to create your first reel
              </span>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {filteredAndSortedReels.map((reel) => (
            <InventoryItem
              key={reel.id}
              reel={reel}
              onView={() => onViewReel?.(reel.id)}
              onExport={(format) => onExportReel?.(reel.id, format)}
              onDelete={() => onDeleteReel?.(reel.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sort button component
 */
function SortButton({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px 12px",
        background: active ? "#3b82f6" : "#f1f5f9",
        color: active ? "white" : "#475569",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 500,
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#e2e8f0";
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = active ? "#3b82f6" : "#f1f5f9";
      }}
    >
      {label}
      {active &&
        (order === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />)}
    </button>
  );
}
