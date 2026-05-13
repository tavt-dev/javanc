import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "./api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthSession } from "@/types/auth";

const originalAdapter = apiClient.defaults.adapter;

function session(): AuthSession {
  return {
    accessToken: "new-access",
    refreshToken: "new-refresh",
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
}

describe("api-client interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: session().user,
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresInSeconds: 3600,
      isAuthenticated: true,
      hasHydrated: true,
    });
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it("attaches bearer token to requests", async () => {
    let authorization: unknown;
    apiClient.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization;
      return {
        data: { success: true, message: "OK", data: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await apiClient.get("/profiles/me");

    expect(authorization).toBe("Bearer old-access");
  });

  it("refreshes concurrent 401 requests with a single refresh call", async () => {
    const refreshSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { success: true, message: "OK", data: session() },
    });
    let adapterCalls = 0;
    apiClient.defaults.adapter = async (config) => {
      adapterCalls += 1;
      if (!Reflect.get(config, "_retry")) {
        return Promise.reject({
          config,
          response: { status: 401 },
        });
      }
      return {
        data: { success: true, message: "OK", data: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await Promise.all([apiClient.get("/profiles/me"), apiClient.get("/profiles/me")]);

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(adapterCalls).toBe(4);
    expect(useAuthStore.getState().accessToken).toBe("new-access");
  });

  it("does not refresh excluded auth endpoints", async () => {
    const refreshSpy = vi.spyOn(axios, "post");
    apiClient.defaults.adapter = async (config) =>
      Promise.reject({ config, response: { status: 401 } });

    await expect(apiClient.post("/auth/login", {})).rejects.toBeTruthy();

    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
