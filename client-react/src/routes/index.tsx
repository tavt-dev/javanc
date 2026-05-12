import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { RootRedirect } from "./RootRedirect";
import { RoleGuard } from "./RoleGuard";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MyProfilePage } from "@/features/profiles/pages/MyProfilePage";
import { ProfileSearchPage } from "@/features/profiles/pages/ProfileSearchPage";
import { ProfileDetailPage } from "@/features/profiles/pages/ProfileDetailPage";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { CompaniesPage } from "@/features/companies/pages/CompaniesPage";
import { CompanyDetailPage } from "@/features/companies/pages/CompanyDetailPage";
import { JobBoardPage } from "@/features/jobs/pages/JobBoardPage";
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage";
import { MyApplicationsPage } from "@/features/jobs/pages/MyApplicationsPage";
import {
  ManageJobsPage,
  MyCompanyPage,
  ManageHRPage,
  UserManagementPage,
  CompanyManagementPage,
  SettingsPage,
} from "@/features/placeholders/pages";

export const router = createBrowserRouter([
  // Root redirect
  { path: "/", element: <RootRedirect /> },

  // Guest routes
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: "/verify-email",
    element: (
      <GuestRoute>
        <VerifyEmailPage />
      </GuestRoute>
    ),
  },

  // Protected routes with AppShell layout
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/profile", element: <MyProfilePage /> },
      { path: "/profiles", element: <ProfileSearchPage /> },
      { path: "/profiles/:id", element: <ProfileDetailPage /> },
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/notifications", element: <NotificationsPage /> },
      { path: "/companies", element: <CompaniesPage /> },
      { path: "/companies/:id", element: <CompanyDetailPage /> },
      { path: "/jobs", element: <JobBoardPage /> },
      { path: "/jobs/:id", element: <JobDetailPage /> },
      {
        path: "/my-applications",
        element: (
          <RoleGuard allow={["user"]}>
            <MyApplicationsPage />
          </RoleGuard>
        ),
      },
      {
        path: "/hr/jobs",
        element: (
          <RoleGuard allow={["hr"]}>
            <ManageJobsPage />
          </RoleGuard>
        ),
      },
      {
        path: "/manager/company",
        element: (
          <RoleGuard allow={["manager"]}>
            <MyCompanyPage />
          </RoleGuard>
        ),
      },
      {
        path: "/manager/hr",
        element: (
          <RoleGuard allow={["manager"]}>
            <ManageHRPage />
          </RoleGuard>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <RoleGuard allow={["admin"]}>
            <UserManagementPage />
          </RoleGuard>
        ),
      },
      {
        path: "/admin/companies",
        element: (
          <RoleGuard allow={["admin"]}>
            <CompanyManagementPage />
          </RoleGuard>
        ),
      },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
