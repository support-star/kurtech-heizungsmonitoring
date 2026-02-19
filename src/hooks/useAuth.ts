import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/heating';

// ═══════════════════════════════════════════════════════════════
//  GEMEINSAMES PASSWORT – für alle Benutzer gleich
// ═══════════════════════════════════════════════════════════════
const SHARED_PASSWORD = 'Darmstadt2026';

const USERS: Record<string, User> = {
  'samir':       { username: 'samir',       password: SHARED_PASSWORD, role: 'admin',      anlageId: '*' },
  'josip':       { username: 'josip',       password: SHARED_PASSWORD, role: 'customer',   anlageId: 'WP-001' },
  'installateur':{ username: 'installateur',password: SHARED_PASSWORD, role: 'installer',  anlageId: '*' },
  'techniker':   { username: 'techniker',   password: SHARED_PASSWORD, role: 'technician', anlageId: '*' },
  'admin':       { username: 'admin',       password: SHARED_PASSWORD, role: 'admin',      anlageId: '*' },
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('kurtech_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('kurtech_user');
      }
    }
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    // Prüfe bekannte Benutzer
    const foundUser = USERS[username.toLowerCase()];
    if (foundUser && password === SHARED_PASSWORD) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('kurtech_user', JSON.stringify(foundUser));
      return true;
    }

    // Unbekannter Name + richtiges Passwort → Gast-Zugang (nur lesen)
    if (password === SHARED_PASSWORD) {
      const guestUser: User = { username, password: '', role: 'customer', anlageId: 'WP-001' };
      setUser(guestUser);
      setIsAuthenticated(true);
      localStorage.setItem('kurtech_user', JSON.stringify(guestUser));
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('kurtech_user');
  }, []);

  return { isAuthenticated, user, login, logout };
}
