import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthSession } from "@/types/auth";

const session: AuthSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer",
  expiresInSeconds: 3600,
  user: {
    id: 1,
    name: "User",
    email: "user@example.com",
    role: "user",
    active: true,
  },
};

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: false,
    });
  });

  it("stores and hydrates a session", () => {
    useAuthStore.getState().setSession(session);
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: false,
    });

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("user@example.com");
    expect(useAuthStore.getState().accessToken).toBe("access-token");
  });

  it("clears corrupt persisted auth data", () => {
    localStorage.setItem("access_token", "token");
    localStorage.setItem("refresh_token", "refresh");
    localStorage.setItem("auth_user", "{bad");

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("logs out locally", () => {
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().logoutLocal();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
