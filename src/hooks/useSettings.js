import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@freecompass/settings';

export const DEFAULTS = {
  northRef: 'true', // 'true' | 'magnetic'
  refreshMs: 1000, // one of REFRESH_OPTIONS below
};

export const REFRESH_OPTIONS = [
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
];

/**
 * App settings backed by AsyncStorage so choices survive app restarts.
 * Returns [settings, setSetting, loaded].
 */
export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  // Load once on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // Corrupt/absent storage — fall back to defaults.
      } finally {
        loadedRef.current = true;
        setLoaded(true);
      }
    })();
  }, []);

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Persist, but never let a write error break the UI.
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return [settings, setSetting, loaded];
}
