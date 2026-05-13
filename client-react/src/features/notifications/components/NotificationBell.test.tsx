import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "./NotificationBell";
import { useAuthStore } from "@/stores/auth-store";

const mutate = vi.fn();

vi.mock("@/features/notifications/hooks/use-notification-queries", () => ({
  useNotificationsQuery: () => ({
    notifications: [
      {
        id: 1,
        message: "New application",
        createAt: "2026-05-12T09:00:00Z",
        read: false,
        idUser: 1,
      },
    ],
    unreadCount: 1,
    isLoading: false,
  }),
  useMarkNotificationReadMutation: () => ({
    mutate,
    isPending: false,
  }),
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    mutate.mockClear();
    useAuthStore.setState({
      user: {
        id: 1,
        name: "User",
        email: "user@example.com",
        role: "user",
        active: true,
      },
      accessToken: "token",
      refreshToken: "refresh",
      expiresInSeconds: 3600,
      isAuthenticated: true,
      hasHydrated: true,
    });
  });

  it("renders unread count and marks a notification read", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("1 unread")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark read" }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
