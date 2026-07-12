import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'fitnfuel:theme';

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  if (!Capacitor.isNativePlatform()) return;
  StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: mode === 'dark' ? '#0D0D18' : '#FAFAFB' }).catch(() => {});
}

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'dark';
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
