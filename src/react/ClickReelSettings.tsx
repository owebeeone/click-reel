/**
 * Settings panel component for user preferences
 * Connects to context and renders the SettingsPanel
 */

import { useClickReelContext } from "./context/ClickReelContext";
import { SettingsPanel } from "./components/SettingsPanel";
import { ActionType } from "../types";
import { DEFAULT_PREFERENCES } from "./hooks/usePreferences";

/**
 * Component for configuring user preferences
 */
export function ClickReelSettings() {
  const { state, dispatch } = useClickReelContext();

  const handleClose = () => {
    dispatch({ type: ActionType.TOGGLE_SETTINGS });
  };

  const handleSave = (preferences: typeof state.preferences) => {
    dispatch({
      type: ActionType.UPDATE_PREFERENCES,
      payload: preferences,
    });
  };

  const handleReset = () => {
    dispatch({
      type: ActionType.UPDATE_PREFERENCES,
      payload: DEFAULT_PREFERENCES,
    });
  };

  return (
    <SettingsPanel
      isOpen={state.ui.settingsVisible}
      onClose={handleClose}
      preferences={state.preferences}
      onSave={handleSave}
      onReset={handleReset}
    />
  );
}
