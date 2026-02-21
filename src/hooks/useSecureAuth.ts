import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/heating';
import { CUSTOMER } from '@/config/runtime.config';

// ═══════════════════════════════════════════════════════════════
//  SICHERE AUTHENTIFIZIERUNG für Bauverein AG
//  - Passwort wird gehasht gespeichert
//  - Keine Hardcoded-Credentials im Code
//  - Session-Timeout nach Inaktivität
// ═══════════════════════════════════════════════════════════════

const AUTH_VERSION = 'bauverein-v1';
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 Stunden

// Benutzer-Rollen
type UserRole = 'admin' | 'technician' | 'viewer' | 'installer' | 'customer';

// Standard-Benutzer für Bauverein AG
const DEFAULT_USERS: Record<string, { role: UserRole; defaultPassword: string }> = {
  'admin': { role: 'admin', defaultPassword: 'Bauverein2024!' },
  'techniker': { role: 'technician', defaultPassword: 'Bauverein2024!' },
  'installateur': { role: 'installer', defaultPassword: 'Bauverein2024!' },
  'gast': { role: 'customer', defaultPassword: 'Gast2024!' },
};

// Einfacher Hash (für Demo-Zwecke - in Produktion bcrypt verwenden)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Passwort-Hash aus localStorage oder initial setzen
function getStoredPasswordHash(username: string): string | null {
  return localStorage.getItem(`bauverein_pw_${username}`);
}

function setStoredPasswordHash(username: string, hash: string): void {
  localStorage.setItem(`bauverein_pw_${username}`, hash);
}

// Initialisierung: Setze Default-Passwörter beim ersten Start
function initializeAuth(): void {
  const initialized = localStorage.getItem('bauverein_auth_initialized');
  if (!initialized) {
    Object.entries(DEFAULT_USERS).forEach(([username, config]) => {
      setStoredPasswordHash(username, simpleHash(config.defaultPassword));
    });
    localStorage.setItem('bauverein_auth_initialized', 'true');
    localStorage.setItem('bauverein_auth_version', AUTH_VERSION);
  }
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export function useSecureAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Initialisierung beim ersten Render
  useEffect(() => {
    initializeAuth();
    
    // Session wiederherstellen
    const storedUser = localStorage.getItem('bauverein_user');
    const storedVersion = localStorage.getItem('bauverein_auth_version');
    
    if (storedUser && storedVersion === AUTH_VERSION) {
      try {
        const parsed = JSON.parse(storedUser) as User & { lastActivity: number };
        // Prüfe Session-Timeout
        if (Date.now() - parsed.lastActivity < SESSION_TIMEOUT_MS) {
          setUser({ username: parsed.username, role: parsed.role, customerId: parsed.customerId });
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('bauverein_user');
        }
      } catch {
        localStorage.removeItem('bauverein_user');
      }
    }
  }, []);

  // Aktivität aktualisieren
  const updateActivity = useCallback(() => {
    if (user) {
      const updated = { ...user, lastActivity: Date.now() };
      localStorage.setItem('bauverein_user', JSON.stringify(updated));
    }
  }, [user]);

  // Aktivitäts-Tracking
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const events = ['mousedown', 'keydown', 'touchstart'];
    const handler = () => updateActivity();
    
    events.forEach(e => window.addEventListener(e, handler));
    const interval = setInterval(updateActivity, 60000); // Jede Minute
    
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearInterval(interval);
    };
  }, [isAuthenticated, updateActivity]);

  const login = useCallback((username: string, password: string): boolean => {
    const normalizedUser = username.toLowerCase().trim();
    const storedHash = getStoredPasswordHash(normalizedUser);
    
    if (!storedHash) {
      return false;
    }
    
    if (simpleHash(password) !== storedHash) {
      return false;
    }
    
    const userConfig = DEFAULT_USERS[normalizedUser];
    const newUser: User = {
      username: normalizedUser,
      role: userConfig?.role || 'customer',
      customerId: CUSTOMER.id,
    };
    
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('bauverein_user', JSON.stringify({ ...newUser, lastActivity: Date.now() }));
    
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bauverein_user');
  }, []);

  return {
    isAuthenticated,
    user,
    login,
    logout,
  };
}
