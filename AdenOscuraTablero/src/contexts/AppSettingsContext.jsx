import { useCallback, useEffect, useState } from 'react';
import { AppSettingsContext } from './AppSettingsContextValue';
import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
  sanitizeAppSettings
} from '../constants/appSettings';

const readStoredSettings = () => {
  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    return sanitizeAppSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
};

export default function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings);

  const persist = useCallback((nextSettings) => {
    try {
      window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    } catch (err) {
      console.warn('No se pudieron guardar las preferencias:', err);
    }
  }, []);

  const updateSettings = useCallback((patchOrUpdater) => {
    setSettings((prev) => {
      const rawNext = typeof patchOrUpdater === 'function' ? patchOrUpdater(prev) : { ...prev, ...patchOrUpdater };
      const clean = sanitizeAppSettings(rawNext);
      persist(clean);
      return clean;
    });
  }, [persist]);

  const updateFloatingPosition = useCallback((panelId, pos) => {
    setSettings((prev) => {
      const nextFloating = { ...(prev.floatingPositions || {}) };
      if (!pos) {
        delete nextFloating[panelId];
      } else {
        nextFloating[panelId] = { x: Math.round(pos.x), y: Math.round(pos.y) };
      }
      const clean = sanitizeAppSettings({ ...prev, floatingPositions: nextFloating });
      persist(clean);
      return clean;
    });
  }, [persist]);

  const resetFloatingPositions = useCallback(() => {
    updateSettings({ floatingPositions: {} });
  }, [updateSettings]);

  const resetSettings = useCallback(() => {
    const defaults = sanitizeAppSettings(DEFAULT_APP_SETTINGS);
    setSettings(defaults);
    persist(defaults);
  }, [persist]);

  const importSettings = useCallback((rawObj) => {
    const clean = sanitizeAppSettings(rawObj);
    setSettings(clean);
    persist(clean);
    return clean;
  }, [persist]);

  useEffect(() => {
    document.documentElement.setAttribute('data-vtt-theme', settings.theme || 'dark');
  }, [settings.theme]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === APP_SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          setSettings(sanitizeAppSettings(JSON.parse(e.newValue)));
        } catch {
          // Ignorar JSON corrupto
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateFloatingPosition,
        resetFloatingPositions,
        resetSettings,
        importSettings
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}
