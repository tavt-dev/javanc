import type { AuthenticationResponse, SavedAccount, User } from "@/lib/types";

const AUTH_TOKEN_KEY = "authToken";
const CURRENT_USER_KEY = "userCurrent";
const AUTH_RESPONSE_KEY = "authResponse";
const SAVED_ACCOUNTS_KEY = "savedAccounts";
const ACTIVE_ACCOUNT_KEY = "activeAccountKey";

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveAuth(auth: AuthenticationResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const safeAuth = sanitizeAuth(auth);
  saveCurrentAuth(safeAuth);
  const account = upsertSavedAccount(safeAuth);
  if (account) {
    window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.key);
  }
}

export function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.localStorage.removeItem(AUTH_RESPONSE_KEY);
  window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SAVED_ACCOUNTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const accounts = JSON.parse(raw) as SavedAccount[];
    return Array.isArray(accounts) ? accounts.filter((account) => account.auth?.token) : [];
  } catch {
    return [];
  }
}

export function activateSavedAccount(key: string): AuthenticationResponse | null {
  const account = getSavedAccounts().find((item) => item.key === key);
  if (!account) {
    return null;
  }

  saveCurrentAuth(account.auth);
  window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.key);
  return account.auth;
}

export function getActiveAccountKey() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

export function removeSavedAccount(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  const accounts = getSavedAccounts().filter((account) => account.key !== key);
  window.localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
  if (window.localStorage.getItem(ACTIVE_ACCOUNT_KEY) === key) {
    clearAuth();
  }
}

function upsertSavedAccount(auth: AuthenticationResponse) {
  if (!auth.token) {
    return null;
  }

  const account = toSavedAccount(auth);
  const next = [account, ...getSavedAccounts().filter((item) => item.key !== account.key)].slice(0, 8);
  window.localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  return account;
}

function saveCurrentAuth(auth: AuthenticationResponse) {
  const safeAuth = sanitizeAuth(auth);

  if (safeAuth.token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, safeAuth.token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (safeAuth.user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeAuth.user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }

  window.localStorage.setItem(AUTH_RESPONSE_KEY, JSON.stringify(safeAuth));
}

function toSavedAccount(auth: AuthenticationResponse): SavedAccount {
  const safeAuth = sanitizeAuth(auth);
  const user = safeAuth.user;
  const key = user?.id
    ? `id:${user.id}`
    : user?.email
      ? `email:${user.email.toLowerCase()}`
      : `token:${safeAuth.token?.slice(0, 32)}`;
  const label = user?.name || user?.email || safeAuth.role || "Saved account";

  return {
    key,
    label,
    email: user?.email,
    role: user?.role ?? safeAuth.role,
    auth: safeAuth,
    savedAt: new Date().toISOString()
  };
}

function sanitizeAuth(auth: AuthenticationResponse): AuthenticationResponse {
  if (!auth.user) {
    return auth;
  }

  const { password, confirmPassword, ...safeUser } = auth.user;
  return { ...auth, user: safeUser };
}
