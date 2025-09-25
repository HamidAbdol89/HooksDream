import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useSettings = () => {
  const { i18n } = useTranslation();

  // Load saved settings when component mounts
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Priority: localStorage > system preference > default light
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);

    // Language
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && i18n.languages.includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Theme handlers
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    return theme;
  };

  const getCurrentTheme = () => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };

  // Language handlers
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  return {
    // Theme
    toggleTheme,
    getCurrentTheme,
    
    // Language
    changeLanguage,
    getCurrentLanguage,
  };
};