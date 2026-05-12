"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthenticationResponse, SavedAccount, User } from "@/lib/types";
import {
  activateSavedAccount,
  clearAuth,
  getActiveAccountKey,
  getSavedAccounts,
  getStoredUser,
  getToken,
  saveAuth
} from "@/lib/storage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  signedIn: boolean;
  savedAccounts: SavedAccount[];
  activeAccountKey: string | null;
  login: (auth: AuthenticationResponse) => void;
  logout: () => void;
  switchAccount: (accountKey: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [activeAccountKey, setActiveAccountKey] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
    setSavedAccounts(getSavedAccounts());
    setActiveAccountKey(getActiveAccountKey());
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
      savedAccounts,
      activeAccountKey,
      login(auth) {
        saveAuth(auth);
        setUser(auth.user ?? null);
        setToken(auth.token ?? null);
        syncAccounts();
      },
      logout() {
        clearAuth();
        setUser(null);
        setToken(null);
        syncAccounts();
        router.push("/login");
      },
      switchAccount(accountKey) {
        const auth = activateSavedAccount(accountKey);
        if (!auth) {
          syncAccounts();
          return;
        }

        setUser(auth.user ?? null);
        setToken(auth.token ?? null);
        syncAccounts();
      }
    }),
    [activeAccountKey, router, savedAccounts, syncAccounts, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
