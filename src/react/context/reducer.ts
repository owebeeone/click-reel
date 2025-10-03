/**
 * Reducer for Click Reel state management
 */

import type { ClickReelState, Action } from "../../types";
import { ActionType } from "../../types";

/**
 * Initial state
 */
export const initialState: ClickReelState = {
  recorderState: "idle",
  currentReel: null,
  inventory: [],
  preferences: {
    markerSize: 20,
    markerColor: "#ff0000",
    exportFormat: "gif",
    postClickDelay: 100,
    postClickInterval: 50,
    maxCaptureDuration: 30000,
    scale: 1,
    maxWidth: undefined,
    maxHeight: undefined,
    obfuscationEnabled: false,
    keyboardShortcuts: {
      toggleRecorder: "ctrl+shift+r",
      toggleObfuscation: "ctrl+shift+o",
      armCapture: "ctrl+shift+a",
      stopRecording: "ctrl+shift+s",
      addFrame: "ctrl+shift+f",
    },
  },
  loading: {
    capturing: false,
    encoding: false,
    saving: false,
    loading: false,
  },
  error: null,
  ui: {
    recorderVisible: true,
    inventoryVisible: false,
    settingsVisible: false,
    obfuscationActive: false,
    selectedReelId: null,
    recorderPosition: { x: 20, y: 20 },
  },
};

/**
 * Reducer function
 */
export function clickReelReducer(
  state: ClickReelState,
  action: Action
): ClickReelState {
  switch (action.type) {
    case ActionType.START_RECORDING:
      return {
        ...state,
        recorderState: "recording",
        currentReel: action.payload,
        error: null,
      };

    case ActionType.ARM:
      return {
        ...state,
        recorderState: "armed",
      };

    case ActionType.DISARM:
      return {
        ...state,
        recorderState: state.currentReel ? "recording" : "idle",
      };

    case ActionType.ADD_FRAME:
      // Frame is already added to the reel in storage
      return state;

    case ActionType.COMPLETE_RECORDING:
      return {
        ...state,
        recorderState: "idle",
        currentReel: null,
      };

    case ActionType.STOP_RECORDING:
      return {
        ...state,
        recorderState: "idle",
        currentReel: null,
      };

    case ActionType.LOAD_INVENTORY:
      return {
        ...state,
        inventory: action.payload,
      };

    case ActionType.SELECT_REEL:
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedReelId: action.payload,
        },
      };

    case ActionType.DELETE_REEL:
      return {
        ...state,
        inventory: state.inventory.filter((r) => r.id !== action.payload),
        ui: {
          ...state.ui,
          selectedReelId:
            state.ui.selectedReelId === action.payload
              ? null
              : state.ui.selectedReelId,
        },
      };

    case ActionType.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionType.TOGGLE_RECORDER_UI:
      return {
        ...state,
        ui: {
          ...state.ui,
          recorderVisible: !state.ui.recorderVisible,
        },
      };

    case ActionType.TOGGLE_INVENTORY:
      return {
        ...state,
        ui: {
          ...state.ui,
          inventoryVisible: !state.ui.inventoryVisible,
        },
      };

    case ActionType.TOGGLE_SETTINGS:
      return {
        ...state,
        ui: {
          ...state.ui,
          settingsVisible: !state.ui.settingsVisible,
        },
      };

    case ActionType.TOGGLE_OBFUSCATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          obfuscationActive: !state.ui.obfuscationActive,
        },
      };

    case ActionType.SET_RECORDER_POSITION:
      return {
        ...state,
        ui: {
          ...state.ui,
          recorderPosition: action.payload,
        },
      };

    case ActionType.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    default:
      return state;
  }
}
