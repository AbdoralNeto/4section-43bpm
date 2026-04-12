import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  
  // Default to light if no session, or load user's preference
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    if (session?.user_id) {
      const storedTheme = localStorage.getItem(`theme_${session.user_id}`);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme);
      } else {
        setTheme('light');
        localStorage.setItem(`theme_${session.user_id}`, 'light');
      }
    } else {
      setTheme('light');
    }
  }, [session?.user_id]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      if (session?.user_id) {
        localStorage.setItem(`theme_${session.user_id}`, newTheme);
      }
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
