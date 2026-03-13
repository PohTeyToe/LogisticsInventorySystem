import { useState, useEffect, useCallback, useMemo } from 'react';

type Theme = 'dark' | 'light';
type ThemePreference = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'logistics-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') return getSystemTheme();
  return preference;
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export default function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  const theme = useMemo<Theme>(
    () => (preference === 'system' ? systemTheme : preference),
    [preference, systemTheme],
  );

  // Apply theme on mount and when preference changes
  useEffect(() => {
    applyTheme(resolveTheme(preference));
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const resolved = getSystemTheme();
      setSystemTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = resolveTheme(prev);
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return { theme, preference, setTheme, toggleTheme } as const;
}
