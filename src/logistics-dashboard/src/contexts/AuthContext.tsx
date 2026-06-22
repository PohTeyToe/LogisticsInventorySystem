import { useState, useEffect, useCallback, type ReactNode } from 'react';
import client from '../api/client';
import { AuthContext, type AuthContextType } from './authContextDef';

export type { AuthContextType };

interface User {
  email: string;
  fullName?: string;
  tenantId: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

function getStoredAuth(): { token: string | null; user: User | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  let user: User | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

function storeAuth(token: string, refreshToken: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const { token, user } = getStoredAuth();
    return {
      user,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    };
  });

  const logout = useCallback(() => {
    clearAuth();
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await client.post('/api/auth/login', { email, password });
      const data = res.data;
      const user: User = { email: data.email, fullName: data.fullName, tenantId: data.tenantId };
      storeAuth(data.token, data.refreshToken, user);
      setState({ user, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await client.post('/api/auth/register', { email, password, fullName });
      const data = res.data;
      const user: User = { email: data.email, fullName: data.fullName, tenantId: data.tenantId };
      storeAuth(data.token, data.refreshToken, user);
      setState({ user, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  // Set up Axios interceptor for 401 handling (auth header is set in client.ts)
  useEffect(() => {
    const responseInterceptor = client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          const currentToken = localStorage.getItem(TOKEN_KEY);

          if (refreshToken && currentToken) {
            try {
              const res = await client.post('/api/auth/refresh', {
                token: currentToken,
                refreshToken,
              });
              const data = res.data;
              const user: User = { email: data.email, fullName: data.fullName, tenantId: data.tenantId };
              storeAuth(data.token, data.refreshToken, user);
              setState({ user, token: data.token, isAuthenticated: true, isLoading: false });
              originalRequest.headers.Authorization = `Bearer ${data.token}`;
              return client(originalRequest);
            } catch {
              // Refresh failed — force logout
              clearAuth();
              setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
              window.location.href = '/login';
              return Promise.reject(error);
            }
          }

          // No refresh token — redirect to login
          clearAuth();
          setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );

    return () => {
      client.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

