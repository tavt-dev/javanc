import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import i18n from "@/i18n";

vi.mock("@/features/auth/components/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <div data-testid="google-sign-in-button" />,
}));

vi.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useLoginMutation: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
  useGoogleLoginMutation: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
  useRegisterMutation: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
}));

describe("auth pages", () => {
  it("shows google login on the login page", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("google-sign-in-button")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: i18n.t("footer.privacy") }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: i18n.t("footer.terms") }),
    ).toHaveAttribute("href", "/terms");
  });

  it("shows google login on the register page", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("google-sign-in-button")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: i18n.t("footer.privacy") }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: i18n.t("footer.terms") }),
    ).toHaveAttribute("href", "/terms");
  });
});
