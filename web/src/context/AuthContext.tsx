import React, { createContext, useContext, useState } from 'react';

export interface Employee {
  id: string;
  username: string;
  full_name: string;
  role: string;
  biometric_enabled: boolean;
}

export interface WmsSettings {
  language: string;
  theme: string;
  scanner_beep: boolean;
  biometrics_enabled: boolean;
  sync_interval_mins: number;
}

interface AuthContextType {
  token: string | null;
  user: Employee | null;
  settings: WmsSettings | null;
  login: (username: string, password: string) => Promise<boolean>;
  pinLogin: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (newSettings: Partial<WmsSettings>) => Promise<void>;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Backend base URL — kept for future use, not required for frontend access
const API_BASE = 'https://thor-wms-backend.onrender.com/api';

// Default user — frontend always appears logged in as Admin
const DEFAULT_USER: Employee = {
  id: 'default-admin',
  username: 'admin',
  full_name: 'Thor Administrator',
  role: 'Admin',
  biometric_enabled: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Frontend is always "logged in" — no auth gate on the UI
  const [token, setToken] = useState<string | null>(localStorage.getItem('thor_wms_token'));
  const [user, setUser] = useState<Employee | null>(DEFAULT_USER);
  const [settings, setSettings] = useState<WmsSettings | null>(null);
  // isLoading is always false — dashboard loads immediately on open
  const [isLoading] = useState<boolean>(false);

  // Login kept in code for future backend integration — not called by UI
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('thor_wms_token', data.token);
      setToken(data.token);
      setUser(data.employee);
      setSettings(data.settings);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // PIN login kept for future use
  const pinLogin = async (username: string, pin: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('thor_wms_token', data.token);
      setToken(data.token);
      setUser(data.employee);
      setSettings(data.settings);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Logout restores the default user — never shows login page
  const logout = () => {
    localStorage.removeItem('thor_wms_token');
    setToken(null);
    setUser(DEFAULT_USER);
    setSettings(null);
  };

  const updateSettings = async (newSettings: Partial<WmsSettings>) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...settings, ...newSettings })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return res.json();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        settings,
        login,
        pinLogin,
        logout,
        updateSettings,
        apiCall,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export { API_BASE };
