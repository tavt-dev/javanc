import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

vi.mock("@/features/companies/hooks/use-company-queries", () => ({
  useAcceptHrPromotionWithCompanyMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useLeaveHrCompanyMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/users/hooks/use-user-queries", () => ({
  useMyHrPromotionsQuery: () => ({ data: [] }),
  useMyRoleRequestsQuery: () => ({ data: [] }),
  useRejectHrPromotionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useRequestManagerUpgradeMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Jane Admin",
        email: "jane.admin@example.com",
        role: "admin",
        active: true,
      },
      accessToken: "token",
      refreshToken: "refresh",
      expiresInSeconds: 3600,
      isAuthenticated: true,
      hasHydrated: true,
    });
    useUIStore.setState({
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: "system",
    });
  });

  it("updates theme preference", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: /Dark/ }));

    expect(useUIStore.getState().theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("toggles compact sidebar preference", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const toggle = screen.getByRole("button", {
      name: "Toggle Compact desktop sidebar",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);

    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
