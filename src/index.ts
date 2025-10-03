/**
 * click-reel - Browser-side interaction recorder
 *
 * Captures annotated screenshots of user interactions and assembles them
 * into animated GIF/APNG files with metadata.
 */

// Export types
export type * from './types';

// Export React components (will be implemented in later phases)
export { ClickReelProvider } from './react/ClickReelProvider';
export { ClickReelRecorder } from './react/ClickReelRecorder';
export { ClickReelInventory } from './react/ClickReelInventory';
export { ClickReelSettings } from './react/ClickReelSettings';

// Export React hooks (will be implemented in later phases)
export { useRecorder } from './react/hooks/useRecorder';
export { useStorage } from './react/hooks/useStorage';
export { useClickCapture } from './react/hooks/useClickCapture';
export { useKeyboardShortcuts } from './react/hooks/useKeyboardShortcuts';

// Export constants
export * from './utils/constants';
