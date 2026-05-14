"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthenticationResponse, SavedAccount, User } from "@/lib/types";
import { authApi } from "@/lib/api";
import {
  clearAuth,
  getActiveAccountKey,
  getSavedAccountCredentials,
  getSavedAccounts,
  getStoredUser,
  getToken,
  markActiveSavedAccount,
  removeSavedAccount as removeSavedAccountFromStorage,
  saveAuth
} from "@/lib/storage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  signedIn: boolean;
  authReady: boolean;
  savedAccounts: SavedAccount[];
  activeAccountKey: string | null;
  login: (auth: AuthenticationResponse, saveAccount?: boolean, credentials?: { email?: string; password?: string }) => void;
  logout: () => void;
  switchAccount: (accountKey: string) => Promise<void>;
  removeSavedAccount: (accountKey: string) => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [activeAccountKey, setActiveAccountKey] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
    setSavedAccounts(getSavedAccounts());
    setActiveAccountKey(getActiveAccountKey());
    setAuthReady(true);
  }, []);

  const syncAccounts = useCallback(() => {
    setSavedAccounts(getSavedAccounts());
    setActiveAccountKey(getActiveAccountKey());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      signedIn: Boolean(token),
      authReady,
      savedAccounts,
      activeAccountKey,
      login(auth, saveAccount = false, credentials) {
        saveAuth(auth, saveAccount, credentials);
        setUser(auth.user ?? null);
        setToken(authToken(auth));
        syncAccounts();
        applyAuthNavigation(router);
      },
      logout() {
        clearAuth();
        setUser(null);
        setToken(null);
        syncAccounts();
        router.push("/login");
      },
      async switchAccount(accountKey) {
        const credentials = getSavedAccountCredentials(accountKey);
        if (!credentials) {
          syncAccounts();
          return;
        }

        const auth = await authApi.signin(credentials);
        saveAuth(auth, true, credentials);
        markActiveSavedAccount(accountKey);
        setUser(auth.user ?? null);
        setToken(authToken(auth));
        syncAccounts();
        applyAuthNavigation(router);
      },
      removeSavedAccount(accountKey) {
        const removingActiveAccount = activeAccountKey === accountKey;
        removeSavedAccountFromStorage(accountKey);
        syncAccounts();

        if (removingActiveAccount) {
          setUser(null);
          setToken(null);
          router.push("/login");
        }
      },
      updateUser(updatedUser) {
        setUser(updatedUser);
      }
    }),
    [activeAccountKey, authReady, router, savedAccounts, syncAccounts, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function authToken(auth?: AuthenticationResponse | null) {
  return auth?.token ?? auth?.accessToken ?? null;
}

function applyAuthNavigation(router: ReturnType<typeof useRouter>) {
  router.replace("/");
  router.refresh();
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
