/**
 * State management types for React components
 */

import type { Reel, ReelSummary } from "./reel";
import type { UserPreferences } from "./config";

/**
 * Possible states of the recorder
 */
export type RecorderState =
  | "idle"
  | "armed"
  | "recording"
  | "processing"
  | "exporting";

/**
 * The main application state
 */
export interface ClickReelState {
  /** Current recorder state */
  recorderState: RecorderState;
  /** Current reel being recorded */
  currentReel: Reel | null;
  /** List of saved reels */
  inventory: ReelSummary[];
  /** User preferences */
  preferences: UserPreferences;
  /** Loading states */
  loading: {
    capturing: boolean;
    encoding: boolean;
    saving: boolean;
    loading: boolean;
  };
  /** Error state */
  error: ErrorState | null;
  /** UI state */
  ui: UIState;
}

/**
 * Error state information
 */
export interface ErrorState {
  /** Error message */
  message: string;
  /** Error code (optional) */
  code?: string;
  /** Additional error details */
  details?: unknown;
  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * UI-specific state
 */
export interface UIState {
  /** Whether recorder UI is visible */
  recorderVisible: boolean;
  /** Whether inventory is visible */
  inventoryVisible: boolean;
  /** Whether settings panel is visible */
  settingsVisible: boolean;
  /** Whether obfuscation is currently active */
  obfuscationActive: boolean;
  /** Currently selected reel in inventory */
  selectedReelId: string | null;
  /** Recorder UI position */
  recorderPosition: { x: number; y: number };
  /** Whether settlement detection is in progress after an armed click */
  settling: boolean;
}

/**
 * Action types for state reducer
 */
export enum ActionType {
  // Recorder actions
  START_RECORDING = "START_RECORDING",
  ARM = "ARM",
  DISARM = "DISARM",
  ADD_FRAME = "ADD_FRAME",
  COMPLETE_RECORDING = "COMPLETE_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",

  // Inventory actions
  LOAD_INVENTORY = "LOAD_INVENTORY",
  SELECT_REEL = "SELECT_REEL",
  DELETE_REEL = "DELETE_REEL",

  // Preferences actions
  UPDATE_PREFERENCES = "UPDATE_PREFERENCES",

  // Error actions
  SET_ERROR = "SET_ERROR",
  CLEAR_ERROR = "CLEAR_ERROR",

  // UI actions
  TOGGLE_RECORDER_UI = "TOGGLE_RECORDER_UI",
  TOGGLE_INVENTORY = "TOGGLE_INVENTORY",
  TOGGLE_SETTINGS = "TOGGLE_SETTINGS",
  TOGGLE_OBFUSCATION = "TOGGLE_OBFUSCATION",
  SET_RECORDER_POSITION = "SET_RECORDER_POSITION",
  SET_SETTLING = "SET_SETTLING",

  // Loading actions
  SET_LOADING = "SET_LOADING",
}

/**
 * Action payloads for state reducer
 */
export type Action =
  | { type: ActionType.START_RECORDING; payload: Reel }
  | { type: ActionType.ARM }
  | { type: ActionType.DISARM }
  | {
      type: ActionType.ADD_FRAME;
      payload: { reelId: string; frame: import("./reel").Frame };
    }
  | { type: ActionType.COMPLETE_RECORDING; payload: { reelId: string } }
  | { type: ActionType.STOP_RECORDING }
  | { type: ActionType.LOAD_INVENTORY; payload: ReelSummary[] }
  | { type: ActionType.SELECT_REEL; payload: string | null }
  | { type: ActionType.DELETE_REEL; payload: string }
  | { type: ActionType.UPDATE_PREFERENCES; payload: Partial<UserPreferences> }
  | { type: ActionType.SET_ERROR; payload: ErrorState }
  | { type: ActionType.CLEAR_ERROR }
  | { type: ActionType.TOGGLE_RECORDER_UI }
  | { type: ActionType.TOGGLE_INVENTORY }
  | { type: ActionType.TOGGLE_SETTINGS }
  | { type: ActionType.TOGGLE_OBFUSCATION }
  | {
      type: ActionType.SET_RECORDER_POSITION;
      payload: { x: number; y: number };
    }
  | { type: ActionType.SET_SETTLING; payload: boolean }
  | {
      type: ActionType.SET_LOADING;
      payload: { key: keyof ClickReelState["loading"]; value: boolean };
    };

/**
 * API exposed by useRecorder hook
 */
export interface RecorderAPI {
  /** Current recorder state */
  state: RecorderState;
  /** Current reel being recorded */
  currentReel: Reel | null;
  /** Start a new recording session */
  startRecording: () => Promise<void>;
  /** Arm the recorder to capture next click */
  arm: () => void;
  /** Disarm the recorder */
  disarm: () => void;
  /** Manually add a frame */
  addFrame: () => Promise<void>;
  /** Stop and save current recording */
  stopRecording: () => Promise<void>;
  /** Export current reel */
  exportReel: (
    reelId: string,
    format?: "gif" | "apng" | "zip"
  ) => Promise<void>;
  /** Loading states */
  loading: ClickReelState["loading"];
  /** Error state */
  error: ErrorState | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * API exposed by useStorage hook
 */
export interface StorageAPI {
  /** Load all reels from storage */
  loadInventory: () => Promise<ReelSummary[]>;
  /** Load a specific reel by ID */
  loadReel: (id: string) => Promise<Reel | null>;
  /** Save a reel to storage */
  saveReel: (reel: Reel) => Promise<string>;
  /** Update reel metadata (title, description) */
  updateReel: (
    id: string,
    updates: Partial<Pick<Reel, "title" | "description">>
  ) => Promise<void>;
  /** Delete a reel from storage */
  deleteReel: (id: string) => Promise<void>;
  /** Get storage quota information */
  getStorageInfo: () => Promise<import("./config").StorageInfo>;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: ErrorState | null;
}
