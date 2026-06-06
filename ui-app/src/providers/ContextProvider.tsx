import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../firebase';
import { type User } from '@loom24/shared/types';
import { type Theme, ThemeColor } from '../types/settings';
import Loading from '../components/Loading';
import { syncUser } from '../services/apiGateway';

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  user: User | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('theme') as Theme) || ThemeColor.Dark);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const dbUser = await syncUser(firebaseUser);
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || dbUser.name || '',
            email: firebaseUser.email ?? firebaseUser.providerData?.find(p => p.email)?.email ?? '',
            img: firebaseUser.photoURL,
            credits: dbUser.credits || 0,
          });
        } catch (error) {
          console.error('Failed to sync user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ theme, setTheme, user, loading }}>
      {loading ? <Loading/> : children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};