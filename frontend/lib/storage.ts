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

export function saveAuth(auth: AuthenticationResponse, saveAccount = false, credentials?: { email?: string; password?: string }) {
  if (typeof window === "undefined") {
    return;
  }

  const safeAuth = sanitizeAuth(auth);
  saveCurrentAuth(safeAuth);
  if (saveAccount) {
    const account = upsertSavedAccount(safeAuth, credentials);
    if (account) {
      window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.key);
    }
  } else {
    window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  }
}

export function setStoredUser(user: User) {
  if (typeof window === "undefined") {
    return;
  }

  const { password, confirmPassword, ...safeUser } = user;
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
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
    return Array.isArray(accounts) ? accounts.filter((account) => account.credentials?.email && account.credentials?.password) : [];
  } catch {
    return [];
  }
}

export function getSavedAccountCredentials(key: string) {
  const account = getSavedAccounts().find((item) => item.key === key);
  return account?.credentials ?? null;
}

export function markActiveSavedAccount(key: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, key);
  }
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

function upsertSavedAccount(auth: AuthenticationResponse, credentials?: { email?: string; password?: string }) {
  if (!credentials?.email || !credentials.password) {
    return null;
  }

  const account = toSavedAccount(auth, { email: credentials.email, password: credentials.password });
  const next = [account, ...getSavedAccounts().filter((item) => item.key !== account.key)].slice(0, 8);
  window.localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  return account;
}

function saveCurrentAuth(auth: AuthenticationResponse) {
  const safeAuth = sanitizeAuth(auth);
  const token = authToken(safeAuth);

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
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

function toSavedAccount(auth: AuthenticationResponse, credentials: { email: string; password: string }): SavedAccount {
  const safeAuth = sanitizeAuth(auth);
  const user = safeAuth.user;
  const email = (user?.email || credentials.email).toLowerCase();
  const key = `email:${email}`;
  const label = user?.name || user?.email || credentials.email || safeAuth.role || "Saved account";

  return {
    key,
    label,
    email,
    role: user?.role ?? safeAuth.role,
    credentials: {
      email: credentials.email,
      password: credentials.password
    },
    savedAt: new Date().toISOString()
  };
}

function sanitizeAuth(auth: AuthenticationResponse): AuthenticationResponse {
  const normalized = { ...auth, token: auth.token ?? auth.accessToken };
  if (!auth.user) {
    return normalized;
  }

  const { password, confirmPassword, ...safeUser } = auth.user;
  return { ...normalized, user: safeUser };
}

function authToken(auth?: AuthenticationResponse | null) {
  return auth?.token ?? auth?.accessToken ?? null;
}
