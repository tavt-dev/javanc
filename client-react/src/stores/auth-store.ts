import { create } from "zustand";
import type { UserDTO, AuthSession } from "@/types/auth";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_USER_KEY = "auth_user";
const EXPIRES_IN_KEY = "auth_expires_in";

function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(EXPIRES_IN_KEY);
}

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresInSeconds: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (session: AuthSession) => void;
  updateUser: (user: UserDTO) => void;
  updateTokens: (session: AuthSession) => void;
  clearSession: () => void;
  logoutLocal: () => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresInSeconds: null,
  isAuthenticated: false,
  hasHydrated: false,

  setSession: (session) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
    localStorage.setItem(EXPIRES_IN_KEY, String(session.expiresInSeconds));
    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresInSeconds: session.expiresInSeconds,
      isAuthenticated: true,
      hasHydrated: true,
    });
  },

  updateUser: (user) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    set({ user });
  },

  updateTokens: (session) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
    localStorage.setItem(EXPIRES_IN_KEY, String(session.expiresInSeconds));
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      expiresInSeconds: session.expiresInSeconds,
      isAuthenticated: true,
    });
  },

  clearSession: () => {
    clearAuthStorage();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  logoutLocal: () => {
    clearAuthStorage();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  logout: () => {
    clearAuthStorage();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  hydrate: () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const expiresInSeconds = Number(localStorage.getItem(EXPIRES_IN_KEY));

    if (!accessToken || !refreshToken || !userJson) {
      clearAuthStorage();
      set({ hasHydrated: true, isAuthenticated: false });
      return;
    }

    try {
      const user = JSON.parse(userJson) as UserDTO;
      set({
        user,
        accessToken,
        refreshToken,
        expiresInSeconds: Number.isFinite(expiresInSeconds)
          ? expiresInSeconds
          : null,
        isAuthenticated: true,
        hasHydrated: true,
      });
    } catch {
      clearAuthStorage();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresInSeconds: null,
        isAuthenticated: false,
        hasHydrated: true,
      });
    }
  },
}));
