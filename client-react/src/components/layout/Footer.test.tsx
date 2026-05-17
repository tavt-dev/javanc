import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { Footer } from "./Footer";

describe("Footer", () => {
  beforeEach(() => {
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
  });

  it("renders legal links", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: i18n.t("footer.about") }),
    ).toHaveAttribute("href", "/about");
    expect(
      screen.getByRole("link", { name: i18n.t("footer.privacy") }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: i18n.t("footer.terms") }),
    ).toHaveAttribute("href", "/terms");
  });
});
