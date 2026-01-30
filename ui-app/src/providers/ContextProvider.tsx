import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../firebase';
import { type User } from '../types/user';
import { type Theme, ThemeColor } from '../types/settings';

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  user: User | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('theme') as Theme) || ThemeColor.Light);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        console.log(firebaseUser.getIdToken())
        const userInfo: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          img: firebaseUser.photoURL,
        }

        setUser(userInfo);
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