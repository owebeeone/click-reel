/**
 * Main context provider for Click Reel
 */

import { type ReactNode, useReducer, useEffect } from "react";
import { ClickReelContext } from "./context/ClickReelContext";
import { clickReelReducer, initialState } from "./context/reducer";
import { getStorageService } from "../core/storage";
import { ActionType } from "../types";

export interface ClickReelProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Click Reel context
 */
export function ClickReelProvider({ children }: ClickReelProviderProps) {
  const [state, dispatch] = useReducer(clickReelReducer, initialState);

  // Load inventory on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const storage = getStorageService();
        await storage.init();
        const inventory = await storage.loadAllReels();
        dispatch({ type: ActionType.LOAD_INVENTORY, payload: inventory });
      } catch (error) {
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
  }, []);

  return (
    <ClickReelContext.Provider value={{ state, dispatch }}>
      {children}
    </ClickReelContext.Provider>
  );
}
