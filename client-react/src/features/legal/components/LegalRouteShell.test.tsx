import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalRouteShell } from "./LegalRouteShell";
import { useAuthStore } from "@/stores/auth-store";

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: () => <div>Authenticated shell</div>,
}));

vi.mock("./PublicLegalShell", () => ({
  PublicLegalShell: () => <div>Public legal shell</div>,
}));

describe("LegalRouteShell", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresInSeconds: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  });

  it("uses the public shell for guests", () => {
    render(<LegalRouteShell />);

    expect(screen.getByText("Public legal shell")).toBeInTheDocument();
  });

  it("uses the app shell for authenticated users", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Jane",
        email: "jane@example.com",
        role: "user",
        active: true,
      },
      accessToken: "token",
      refreshToken: "refresh",
      expiresInSeconds: 3600,
      isAuthenticated: true,
      hasHydrated: true,
    });

    render(<LegalRouteShell />);

    expect(screen.getByText("Authenticated shell")).toBeInTheDocument();
  });
});
