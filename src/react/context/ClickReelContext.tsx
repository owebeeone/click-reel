/**
 * React Context for Click Reel state management
 */

import { createContext, useContext, type Dispatch } from "react";
import type { ClickReelState, Action } from "../../types";

/**
 * Context value type
 */
export interface ClickReelContextValue {
  state: ClickReelState;
  dispatch: Dispatch<Action>;
}

/**
 * Click Reel Context
 */
export const ClickReelContext = createContext<ClickReelContextValue | null>(
  null
);

/**
 * Hook to access Click Reel context
 */
export function useClickReelContext(): ClickReelContextValue {
  const context = useContext(ClickReelContext);

  if (!context) {
    throw new Error(
      "useClickReelContext must be used within a ClickReelProvider"
    );
  }

  return context;
}
