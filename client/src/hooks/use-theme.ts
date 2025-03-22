import { useEffect } from 'react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export function useTheme() {
  const { preferences, updatePreference } = useUserPreferences();

  // Monitor system theme changes
  useEffect(() => {
    if (preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', updateTheme);
    updateTheme(mediaQuery);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [preferences.theme]);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updatePreference('theme', theme);
  };

  const setAccentColor = (color: string) => {
    updatePreference('accentColor', color);
  };

  return {
    theme: preferences.theme,
    setTheme,
    accentColor: preferences.accentColor,
    setAccentColor,
    isDark: preferences.theme === 'dark' || 
      (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  };
}