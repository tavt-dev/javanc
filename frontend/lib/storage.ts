import type { AuthenticationResponse, User } from "@/lib/types";

const AUTH_TOKEN_KEY = "authToken";
const CURRENT_USER_KEY = "userCurrent";
const AUTH_RESPONSE_KEY = "authResponse";

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

  if (auth.token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
  }

  if (auth.user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(auth.user));
  }

  window.localStorage.setItem(AUTH_RESPONSE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.localStorage.removeItem(AUTH_RESPONSE_KEY);
}
