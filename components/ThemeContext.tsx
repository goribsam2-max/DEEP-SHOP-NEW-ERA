import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode, e?: React.MouseEvent | HTMLElement | { clientX: number, clientY: number }) => void;
  toggleTheme: (e?: React.MouseEvent | any) => void;
};

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'system', 
  isDark: false, 
  setTheme: () => {},
  toggleTheme: () => {} 
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  const applyThemeClass = (isDarkMode: boolean) => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const isDarkMode = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
    setIsDark(isDarkMode);
    applyThemeClass(isDarkMode);

    const listener = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDark(e.matches);
        applyThemeClass(e.matches);
      }
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = useCallback(async (mode: ThemeMode, event?: React.MouseEvent | HTMLElement | { clientX: number, clientY: number }) => {
    const nextIsDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark === nextIsDark && theme === mode) return;

    if (!document.startViewTransition || !event) {
      setThemeState(mode);
      localStorage.setItem('theme', mode);
      return;
    }

    let centerX = 0;
    let centerY = 0;

    if ('clientX' in event && typeof event.clientX === 'number') {
      centerX = event.clientX;
      centerY = event.clientY;
    } else if (event instanceof Element) {
      const rect = event.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    } else if ('currentTarget' in event && event.currentTarget instanceof Element) {
      const rect = event.currentTarget.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setThemeState(mode);
        setIsDark(nextIsDark);
        applyThemeClass(nextIsDark);
        localStorage.setItem('theme', mode);
      });
    });

    try {
      await transition.ready;
      const maxDistance = Math.hypot(
        Math.max(centerX, window.innerWidth - centerX),
        Math.max(centerY, window.innerHeight - centerY)
      );

      // Randomize the animation style based on whether it's a system change or explicit light/dark
      let clipPath = [
        `circle(0px at ${centerX}px ${centerY}px)`,
        `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
      ];

      if (mode === 'system') {
        clipPath = [
          `inset(100% 100% 100% 100%)`,
          `inset(0% 0% 0% 0%)`,
        ];
      }

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 400,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } catch (e) {
      // Transition failed
    }

  }, [isDark, theme]);

  const toggleTheme = useCallback((e?: React.MouseEvent) => {
    setTheme(isDark ? 'light' : 'dark', e);
  }, [isDark, setTheme]);

  return <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

