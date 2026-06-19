"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi, setToken, getToken, clearToken, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      try {
        // Decode JWT payload (no verification — backend does that on every request)
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        const isExpired = payload.exp && payload.exp * 1000 < Date.now();
        if (!isExpired) {
          setTokenState(storedToken);
          setUser({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions || [],
          });
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useHasPermission(...perms: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return perms.some((p) => user.permissions.includes(p));
}
