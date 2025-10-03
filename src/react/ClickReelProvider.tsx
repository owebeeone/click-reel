/**
 * Context provider for click-reel state management
 * @placeholder - Will be fully implemented in Phase 6
 */

import { type ReactNode } from 'react';

export interface ClickReelProviderProps {
  children: ReactNode;
}

/**
 * Provides click-reel context to child components
 */
export function ClickReelProvider({ children }: ClickReelProviderProps) {
  return <>{children}</>;
}
