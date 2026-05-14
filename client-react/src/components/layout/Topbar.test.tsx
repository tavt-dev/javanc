import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { Topbar } from "./Topbar";

const logoutMutateMock = vi.fn();

vi.mock("@/features/notifications/components/NotificationBell", () => ({
  NotificationBell: () => (
    <button type="button" aria-label="Notifications">
      Notifications
    </button>
  ),
}));

vi.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useLogoutMutation: () => ({ mutate: logoutMutateMock, isPending: false }),
}));

vi.mock("@/features/users/hooks/use-user-queries", () => ({
  useMyHrPromotionsQuery: () => ({ data: [] }),
}));

describe("Topbar", () => {
  beforeEach(() => {
    logoutMutateMock.mockClear();
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
  });

  it("exposes menu state through aria-expanded", async () => {
    const user = userEvent.setup();
    renderTopbar();

    const themeButton = screen.getByRole("button", {
      name: i18n.t("nav.changeTheme"),
    });
    expect(themeButton).toHaveAttribute("aria-expanded", "false");

    await user.click(themeButton);

    expect(themeButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes open menus with Escape", async () => {
    const user = userEvent.setup();
    renderTopbar();

    const userMenuButton = screen.getByRole("button", {
      name: i18n.t("nav.openUserMenu"),
    });

    await user.click(userMenuButton);
    expect(userMenuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(userMenuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("calls logout mutation with the current access token", async () => {
    const user = userEvent.setup();
    renderTopbar();

    await user.click(
      screen.getByRole("button", { name: i18n.t("nav.openUserMenu") }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: i18n.t("auth.logout") }),
    );

    expect(logoutMutateMock).toHaveBeenCalledWith("token");
  });
});

function renderTopbar() {
  return render(
    <MemoryRouter>
      <Topbar />
    </MemoryRouter>,
  );
}
