import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Topbar } from "./Topbar";
import { useAuthStore } from "@/stores/auth-store";

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

    const themeButton = screen.getByRole("button", { name: "Change theme" });
    expect(themeButton).toHaveAttribute("aria-expanded", "false");

    await user.click(themeButton);

    expect(themeButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes open menus with Escape", async () => {
    const user = userEvent.setup();
    renderTopbar();

    const userMenuButton = screen.getByRole("button", {
      name: "Open user menu",
    });

    await user.click(userMenuButton);
    expect(userMenuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(userMenuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("calls logout mutation with the current access token", async () => {
    const user = userEvent.setup();
    renderTopbar();

    await user.click(screen.getByRole("button", { name: "Open user menu" }));
    await user.click(screen.getByRole("menuitem", { name: /logout/i }));

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
