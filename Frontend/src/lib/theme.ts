'use client';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'ksef-theme';

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'dark' || value === 'light';

export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(stored) ? stored : null;
};

export const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = getStoredTheme();

  if (stored) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.classList.toggle('theme-light', theme === 'light');
  root.classList.toggle('theme-dark', theme === 'dark');

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};

export const toggleThemeMode = (theme: ThemeMode): ThemeMode =>
  theme === 'dark' ? 'light' : 'dark';
