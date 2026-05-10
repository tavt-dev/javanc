"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthenticationResponse, User } from "@/lib/types";
import { clearAuth, getStoredUser, getToken, saveAuth } from "@/lib/storage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  signedIn: boolean;
  login: (auth: AuthenticationResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      signedIn: Boolean(token),
      login(auth) {
        saveAuth(auth);
        setUser(auth.user ?? null);
        setToken(auth.token ?? null);
      },
      logout() {
        clearAuth();
        setUser(null);
        setToken(null);
        router.push("/login");
      }
    }),
    [router, token, user]
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
