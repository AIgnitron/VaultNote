import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode, ThemeColors, AppTheme } from '../types';
import { DEFAULT_ACCENT_COLOR } from '../constants';

// ─── Color Palettes ──────────────────────────────────────────
function getDarkColors(accent: string): ThemeColors {
  return {
    background: '#1E1F23',
    surface: '#27282D',
    card: '#2C2D32',
    text: '#F5F5F5',
    textSecondary: '#A0A0A5',
    accent,
    border: '#3A3B40',
    danger: '#E74C3C',
    dangerBackground: '#3D2020',
    pinnedBackground: '#2A3530',
    inputBackground: '#2C2D32',
    placeholder: '#6E6F74',
    icon: '#B0B0B5',
    statusBar: 'light-content',
  };
}

function getLightColors(accent: string): ThemeColors {
  return {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    accent,
    border: '#E0E0E0',
    danger: '#E74C3C',
    dangerBackground: '#FDE8E8',
    pinnedBackground: '#E8F5E9',
    inputBackground: '#F0F0F0',
    placeholder: '#9E9E9E',
    icon: '#666666',
    statusBar: 'dark-content',
  };
}

// ─── Storage Keys ────────────────────────────────────────────
const STORAGE_KEY_THEME = '@vaultnote_theme_mode';
const STORAGE_KEY_ACCENT = '@vaultnote_accent_color';

// ─── Context ─────────────────────────────────────────────────
interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  accentColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT_COLOR);
  const [loaded, setLoaded] = useState(false);

  // Load persisted settings
  useEffect(() => {
    (async () => {
      try {
        const [storedMode, storedAccent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_THEME),
          AsyncStorage.getItem(STORAGE_KEY_ACCENT),
        ]);
        if (storedMode) setThemeModeState(storedMode as ThemeMode);
        if (storedAccent) setAccentColorState(storedAccent);
      } catch {
        // Ignore errors, use defaults
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY_THEME, mode).catch(() => {});
  }, []);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
    AsyncStorage.setItem(STORAGE_KEY_ACCENT, color).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const theme = useMemo<AppTheme>(() => {
    const colors = isDark ? getDarkColors(accentColor) : getLightColors(accentColor);
    return { mode: themeMode, colors };
  }, [isDark, accentColor, themeMode]);

  if (!loaded) return null; // Prevent flash of wrong theme

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, accentColor, setThemeMode, setAccentColor, isDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
