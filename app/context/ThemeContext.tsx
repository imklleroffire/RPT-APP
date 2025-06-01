import React, { createContext, useContext, useState } from 'react';

interface Colors {
  primary: string;
  secondary: string;
  background: {
    primary: string;
    secondary: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  success: string;
  warning: string;
  error: string;
}

const themes: Record<string, Colors> = {
  neon: {
    primary: '#00ff00',
    secondary: '#ff00ff',
    background: {
      primary: '#000000',
      secondary: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    },
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
  },
  cyberpunk: {
    primary: '#ff2a6d',
    secondary: '#05d9e8',
    background: {
      primary: '#1a1a2e',
      secondary: '#16213e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    },
    success: '#00ff9f',
    warning: '#ff9f00',
    error: '#ff2a6d',
  },
  synthwave: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    background: {
      primary: '#2b1055',
      secondary: '#4a157a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    },
    success: '#00ff9f',
    warning: '#ffff00',
    error: '#ff0000',
  },
  blackGold: {
    primary: '#ffd700',
    secondary: '#c5a100',
    background: {
      primary: '#000000',
      secondary: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    },
    success: '#ffd700',
    warning: '#ff9f00',
    error: '#ff0000',
  },
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: {
      primary: '#ffffff',
      secondary: '#f2f2f7',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: {
      primary: '#000000',
      secondary: '#1c1c1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8e8e93',
    },
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
};

interface ThemeContextType {
  colors: Colors;
  currentTheme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('neon');

  const value = {
    colors: themes[currentTheme],
    currentTheme,
    setTheme: setCurrentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const THEME_OPTIONS = [
  { id: 'neon', name: 'Neon', icon: 'color-palette' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: 'flash' },
  { id: 'synthwave', name: 'Synthwave', icon: 'musical-notes' },
  { id: 'blackGold', name: 'Black & Gold', icon: 'star' },
  { id: 'light', name: 'Light Mode', icon: 'sunny' },
  { id: 'dark', name: 'Dark Mode', icon: 'moon' },
] as const; 