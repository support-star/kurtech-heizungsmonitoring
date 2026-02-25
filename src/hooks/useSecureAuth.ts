import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/heating';
import { CUSTOMER } from '@/config/runtime.config';

// ═══════════════════════════════════════════════════════════════
//  AUTH v2 - Backend-basiert, JWT Token
//  Credentials werden NUR serverseitig validiert
// ═══════════════════════════════════════════════════════════════

const AUTH_VERSION = 'bauverein-v2';
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 Stunden
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://bauverein.kurtech.shop');
const LOGIN_URL = `${BACKEND_URL}/api/auth/login`;

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export function useSecureAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Session wiederherstellen
  useEffect(() => {
    const storedUser = localStorage.getItem('bauverein_user');
    const storedVersion = localStorage.getItem('bauverein_auth_version');
    const storedToken = localStorage.getItem('bauverein_jwt');

    if (storedUser && storedVersion === AUTH_VERSION && storedToken) {
      try {
        const parsed = JSON.parse(storedUser) as User & { lastActivity: number };
        if (Date.now() - parsed.lastActivity < SESSION_TIMEOUT_MS) {
          setUser({ username: parsed.username, role: parsed.role, customerId: parsed.customerId });
          setIsAuthenticated(true);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }
  }, []);

  // Aktivitäts-Tracking
  const updateActivity = useCallback(() => {
    if (user) {
      const updated = { ...user, lastActivity: Date.now() };
      localStorage.setItem('bauverein_user', JSON.stringify(updated));
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['mousedown', 'keydown', 'touchstart'];
    const handler = () => updateActivity();
    events.forEach(e => window.addEventListener(e, handler));
    const interval = setInterval(updateActivity, 60000);
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearInterval(interval);
    };
  }, [isAuthenticated, updateActivity]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase().trim(), password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (!data.token || !data.user) return false;

      // JWT Token serversicher speichern
      localStorage.setItem('bauverein_jwt', data.token);
      localStorage.setItem('bauverein_auth_version', AUTH_VERSION);

      const newUser: User = {
        username: data.user.username,
        role: data.user.role,
        customerId: CUSTOMER.id,
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('bauverein_user', JSON.stringify({ ...newUser, lastActivity: Date.now() }));

      return true;
    } catch (err) {
      console.error('Login request failed:', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, user, login, logout };
}

function clearSession() {
  localStorage.removeItem('bauverein_user');
  localStorage.removeItem('bauverein_jwt');
  localStorage.removeItem('bauverein_auth_version');
}
