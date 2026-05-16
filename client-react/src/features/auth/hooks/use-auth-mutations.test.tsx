import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/features/auth/api/auth-api";
import { useGoogleLoginMutation } from "./use-auth-mutations";
import { useAuthStore } from "@/stores/auth-store";

vi.mock("@/features/auth/api/auth-api", () => ({
  authApi: {
    googleLogin: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    message: vi.fn(),
  },
}));

const mockedAuthApi = vi.mocked(authApi);

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("useGoogleLoginMutation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: false,
    });
  });

  it("stores the backend session after google login", async () => {
    mockedAuthApi.googleLogin.mockResolvedValueOnce({
      success: true,
      message: "Login successfully",
      data: {
        accessToken: "access",
        refreshToken: "refresh",
        tokenType: "Bearer",
        expiresInSeconds: 3600,
        user: {
          id: 1,
          name: "Google User",
          email: "google@example.com",
          role: "user",
          active: true,
          provider: "GOOGLE",
        },
      },
    });
    const { result } = renderHook(() => useGoogleLoginMutation(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ idToken: "google-id-token" });
    });

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe("access");
    });
    expect(mockedAuthApi.googleLogin).toHaveBeenCalledWith({
      idToken: "google-id-token",
    });
    expect(useAuthStore.getState().user?.provider).toBe("GOOGLE");
  });
});
