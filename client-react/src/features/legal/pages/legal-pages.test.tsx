import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import { LegalRouteShell } from "@/features/legal/components/LegalRouteShell";
import { AboutPage } from "./AboutPage";
import { PrivacyPage } from "./PrivacyPage";
import { TermsPage } from "./TermsPage";
import i18n from "@/i18n";

describe("legal pages", () => {
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

  it.each([
    ["/about", i18n.t("legal.about.title"), <AboutPage />],
    ["/privacy", i18n.t("legal.privacy.title"), <PrivacyPage />],
    ["/terms", i18n.t("legal.terms.title"), <TermsPage />],
  ])("renders %s for guests", (path, title, page) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<LegalRouteShell />}>
            <Route path={path} element={page} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: i18n.t("legal.backToSignIn") }),
    ).toBeInTheDocument();
  });
});
