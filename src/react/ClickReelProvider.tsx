/**
 * Main context provider for Click Reel
 */

import { type ReactNode, useReducer, useEffect } from "react";
import { ClickReelContext } from "./context/ClickReelContext";
import { clickReelReducer, getInitialState } from "./context/reducer";
import { getStorageService } from "../core/storage";
import { ActionType } from "../types";

export interface ClickReelProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Click Reel context
 */
export function ClickReelProvider({ children }: ClickReelProviderProps) {
  // Use lazy initialization to load preferences fresh from localStorage on every mount
  const [state, dispatch] = useReducer(clickReelReducer, null, getInitialState);

  // Note: Preferences are now loaded synchronously in the reducer's initial state
  // This ensures ClickReelComplete renders with correct preferences from the start

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "click-reel-preferences",
        JSON.stringify(state.preferences)
      );
      console.log(
        "💾 Click Reel: Saved preferences to localStorage",
        state.preferences
      );
    } catch (error) {
      console.warn("Failed to save Click Reel preferences:", error);
    }
  }, [state.preferences]);

  // Load inventory on mount
  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        // Guard for non-browser test environments
        if (typeof window === 'undefined') return;
        const storage = getStorageService();
        await storage.init();
        const inventory = await storage.loadAllReels();
        if (!isMounted) return;
        dispatch({ type: ActionType.LOAD_INVENTORY, payload: inventory });
      } catch (error) {
        if (!isMounted) return;
        dispatch({
          type: ActionType.SET_ERROR,
          payload: {
            message: "Failed to load inventory",
            timestamp: Date.now(),
            details: error,
          },
        });
      }
    };

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ClickReelContext.Provider value={{ state, dispatch }}>
      {children}
    </ClickReelContext.Provider>
  );
}
