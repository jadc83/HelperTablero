import { useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContextValue';
import { DEFAULT_APP_SETTINGS } from '../constants/appSettings';

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_APP_SETTINGS,
      updateSettings: () => {},
      updateFloatingPosition: () => {},
      resetFloatingPositions: () => {},
      resetSettings: () => {},
      importSettings: () => DEFAULT_APP_SETTINGS
    };
  }
  return ctx;
}
