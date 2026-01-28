import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';

type Theme = 'light' | 'dark';

type User = {
  id: string;
  email: string;
}

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  user: User;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('theme') as Theme) || 'light');
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ theme, setTheme, user }}>
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};