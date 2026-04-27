import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getItem, setItem } from '../lib/storage';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  colors: typeof darkColors;
}

const darkColors = {
  background: '#0a0b0f',
  surface: '#13141a',
  surfaceHighlight: '#1c1d25',
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.45)',
  textDim: 'rgba(255,255,255,0.25)',
  navBackground: 'rgba(14,15,20,0.95)',
  // Accent colors
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  red: '#ef4444',
  pink: '#ec4899',
  blue: '#3b82f6',
  indigo: '#6366f1',
};

const lightColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHighlight: '#f1f5f9',
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.1)',
  text: '#0f172a',
  textSecondary: 'rgba(15,23,42,0.7)',
  textMuted: 'rgba(15,23,42,0.45)',
  textDim: 'rgba(15,23,42,0.25)',
  navBackground: 'rgba(255,255,255,0.95)',
  // Accent colors
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  red: '#ef4444',
  pink: '#ec4899',
  blue: '#3b82f6',
  indigo: '#6366f1',
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  colors: darkColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    getItem('ar_theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    });
  }, []);

  useEffect(() => {
    setItem('ar_theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
