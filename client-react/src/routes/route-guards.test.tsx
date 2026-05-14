import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { GuestRoute } from "@/routes/GuestRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleGuard } from "@/routes/RoleGuard";
import { DashboardRedirect } from "@/routes/DashboardRedirect";
import { useAuthStore } from "@/stores/auth-store";
import i18n from "@/i18n";

describe("route guards", () => {
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

  it("redirects guests away from protected routes", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("redirects authenticated users away from guest routes", () => {
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

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>Login</div>
              </GuestRoute>
            }
          />
          <Route path="/user/dashboard" element={<div>User Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("User Dashboard")).toBeInTheDocument();
  });

  it("redirects the shared dashboard route to the current role dashboard", () => {
    useAuthStore.setState({
      user: {
        id: 2,
        name: "HR",
        email: "hr@example.com",
        role: "hr",
        active: true,
      },
      accessToken: "token",
      refreshToken: "refresh",
      expiresInSeconds: 3600,
      isAuthenticated: true,
      hasHydrated: true,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/hr/dashboard" element={<div>HR Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("HR Dashboard")).toBeInTheDocument();
  });

  it("renders role-protected content only for allowed roles", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        active: true,
      },
      accessToken: "token",
      refreshToken: "refresh",
      expiresInSeconds: 3600,
      isAuthenticated: true,
      hasHydrated: true,
    });

    render(
      <RoleGuard allow={["admin"]}>
        <div>Admin workspace</div>
      </RoleGuard>,
    );

    expect(screen.getByText("Admin workspace")).toBeInTheDocument();
  });

  it("renders permission state for disallowed roles", () => {
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

    render(
      <RoleGuard allow={["admin"]}>
        <div>Admin workspace</div>
      </RoleGuard>,
    );

    expect(screen.getByText(i18n.t("errors.accessDeniedTitle"))).toBeInTheDocument();
  });
});
