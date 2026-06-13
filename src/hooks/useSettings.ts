import { useCallback, useEffect, useState } from 'react';

export interface AppSettings {
  /** Flag suspected silent (Type-0) SMS patterns in the live feed. */
  silentSmsDetection: boolean;
  /** Raise an alert (and sound, if enabled) when a silent SMS is detected. */
  silentSmsAlerts: boolean;
  alertsEnabled: boolean;
  soundAlerts: boolean;
  autoScan: boolean;
  scanFrequency: string;
  deviceGain: string;
  logRetention: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  silentSmsDetection: true,
  silentSmsAlerts: true,
  alertsEnabled: true,
  soundAlerts: false,
  autoScan: true,
  scanFrequency: '935.2',
  deviceGain: '40',
  logRetention: '30',
};

const STORAGE_KEY = 'signalguardian.settings';

const readSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/** Read the current settings outside React (e.g. inside timers/callbacks). */
export const getSettings = readSettings;

export const useSettings = () => {
  const [settings, setSettingsState] = useState<AppSettings>(readSettings);

  // Keep multiple tabs / components in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettingsState(readSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / disabled storage */
      }
      return next;
    });
  }, []);

  return { settings, update };
};
