import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  username: string;
  fullname: string;
  role: string;
  has_face: boolean;
  has_seen_tutorial: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User) => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getCookie('token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = () => {
    if (token) {
      api.user.getProfile()
        .then((data: any) => setUser(data))
        .catch(() => {
          setToken(null);
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [token]);

  // Sync session across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'attendance_auth_sync') {
        const newToken = getCookie('token');
        if (newToken !== token) {
          setToken(newToken);
          if (!newToken) setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const login = (newToken: string) => {
    // Set session cookie (no expires/max-age means it clears on close)
    document.cookie = `token=${newToken}; path=/; SameSite=Lax`;
    setToken(newToken);
    // Signal other tabs
    localStorage.setItem('attendance_auth_sync', Date.now().toString());
  };

  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setToken(null);
    setUser(null);
    // Signal other tabs
    localStorage.setItem('attendance_auth_sync', Date.now().toString());
  };

  const refreshProfile = () => {
    fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, setUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
