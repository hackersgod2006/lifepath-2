import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  biggestStruggle?: string | null;
  addictionType?: string | null;
  activeModules: string[];
  onboardingComplete: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const TOKEN_KEY = "lifepath_token";
const AuthContext = createContext<AuthContextValue | null>(null);

async function apiAuthPost(path: string, body: object) {
  const res = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

async function apiAuthGet(path: string, token: string) {
  const res = await fetch(`/api/auth${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Wire auth token getter for all API client calls
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  // On mount: restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    apiAuthGet("/me", stored)
      .then(user => {
        setState({ user, token: stored, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiAuthPost("/login", { email, password });
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await apiAuthPost("/register", { name, email, password });
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("lifepath_onboarded");
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const user = await apiAuthGet("/me", token);
      setState(s => ({ ...s, user }));
    } catch {
      // ignore
    }
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setState(s => s.user ? { ...s, user: { ...s.user, ...updates } } : s);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
