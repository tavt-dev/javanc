import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse } from "@/types/api";
import type { AuthSession } from "@/types/auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<AuthSession> | null = null;

const authRefreshExclusions = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-verification-otp",
  "/auth/refresh",
];

function isRefreshExcluded(url?: string) {
  if (!url) return false;
  return authRefreshExclusions.some((path) => url.includes(path));
}

function clearSessionAndRedirect() {
  useAuthStore.getState().clearSession();
  queryClient.clear();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function refreshSession(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<AuthSession>>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      })
      .then((response) => {
        const session = response.data.data;
        useAuthStore.getState().updateTokens(session);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshExcluded(originalRequest.url)
    ) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const session = await refreshSession(refreshToken);
          originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
          originalRequest.headers.set(
            "Authorization",
            `Bearer ${session.accessToken}`,
          );
          return apiClient(originalRequest);
        } catch {
          clearSessionAndRedirect();
          return Promise.reject(error);
        }
      }

      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
