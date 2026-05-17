import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import Colors, { type AppTheme } from '@/constants/colors';

const STORAGE_KEY = 'quran-journal-theme';

type ThemeContextValue = { theme: AppTheme; setTheme: (theme: AppTheme) => void; colors: (typeof Colors)['light'] };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<AppTheme>(systemTheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    void (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'sepia') setThemeState(saved);
      else setThemeState(systemTheme === 'dark' ? 'dark' : 'light');
    })();
  }, [systemTheme]);

  const setTheme = (next: AppTheme) => {
    setThemeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(() => ({ theme, setTheme, colors: Colors[theme] }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
