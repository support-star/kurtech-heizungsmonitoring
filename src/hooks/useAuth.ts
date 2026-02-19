import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/heating';

const USERS: Record<string, User> = {
  'benutzer1': { username: 'benutzer1', password: '1', role: 'customer', anlageId: 'WP-001' },
  'benutzer2': { username: 'benutzer2', password: '1', role: 'customer', anlageId: 'WP-002' },
  'installateur': { username: 'installateur', password: '1', role: 'installer', anlageId: '*' },
  'techniker': { username: 'techniker', password: '1', role: 'technician', anlageId: '*' },
  'admin': { username: 'admin', password: '1', role: 'admin', anlageId: '*' },
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
    const foundUser = USERS[username.toLowerCase()];
    if (foundUser && foundUser.password === password) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('kurtech_user', JSON.stringify(foundUser));
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
