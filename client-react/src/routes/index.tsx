/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { RootRedirect } from "./RootRedirect";
import { RoleGuard } from "./RoleGuard";

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("@/features/auth/pages/VerifyEmailPage").then((module) => ({
    default: module.VerifyEmailPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const MyProfilePage = lazy(() =>
  import("@/features/profiles/pages/MyProfilePage").then((module) => ({
    default: module.MyProfilePage,
  })),
);
const ProfileSearchPage = lazy(() =>
  import("@/features/profiles/pages/ProfileSearchPage").then((module) => ({
    default: module.ProfileSearchPage,
  })),
);
const ProfileDetailPage = lazy(() =>
  import("@/features/profiles/pages/ProfileDetailPage").then((module) => ({
    default: module.ProfileDetailPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("@/features/projects/pages/ProjectsPage").then((module) => ({
    default: module.ProjectsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/features/notifications/pages/NotificationsPage").then((module) => ({
    default: module.NotificationsPage,
  })),
);
const CompaniesPage = lazy(() =>
  import("@/features/companies/pages/CompaniesPage").then((module) => ({
    default: module.CompaniesPage,
  })),
);
const CompanyDetailPage = lazy(() =>
  import("@/features/companies/pages/CompanyDetailPage").then((module) => ({
    default: module.CompanyDetailPage,
  })),
);
const JobBoardPage = lazy(() =>
  import("@/features/jobs/pages/JobBoardPage").then((module) => ({
    default: module.JobBoardPage,
  })),
);
const JobDetailPage = lazy(() =>
  import("@/features/jobs/pages/JobDetailPage").then((module) => ({
    default: module.JobDetailPage,
  })),
);
const MyApplicationsPage = lazy(() =>
  import("@/features/jobs/pages/MyApplicationsPage").then((module) => ({
    default: module.MyApplicationsPage,
  })),
);
const ManageJobsPage = lazy(() =>
  import("@/features/jobs/pages/ManageJobsPage").then((module) => ({
    default: module.ManageJobsPage,
  })),
);
const JobApplicantsPage = lazy(() =>
  import("@/features/jobs/pages/JobApplicantsPage").then((module) => ({
    default: module.JobApplicantsPage,
  })),
);
const MyCompanyPage = lazy(() =>
  import("@/features/companies/pages/MyCompanyPage").then((module) => ({
    default: module.MyCompanyPage,
  })),
);
const ManageHRPage = lazy(() =>
  import("@/features/companies/pages/ManageHRPage").then((module) => ({
    default: module.ManageHRPage,
  })),
);
const UserManagementPage = lazy(() =>
  import("@/features/users/pages/UserManagementPage").then((module) => ({
    default: module.UserManagementPage,
  })),
);
const CompanyManagementPage = lazy(() =>
  import("@/features/companies/pages/CompanyManagementPage").then((module) => ({
    default: module.CompanyManagementPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

function lazyPage(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <LoadingSkeleton variant="detail" />
        </div>
      }
    >
      {page}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Root redirect
  { path: "/", element: <RootRedirect /> },

  // Guest routes
  {
    path: "/login",
    element: (
      <GuestRoute>
        {lazyPage(<LoginPage />)}
      </GuestRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestRoute>
        {lazyPage(<RegisterPage />)}
      </GuestRoute>
    ),
  },
  {
    path: "/verify-email",
    element: (
      <GuestRoute>
        {lazyPage(<VerifyEmailPage />)}
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
      { path: "/dashboard", element: lazyPage(<DashboardPage />) },
      { path: "/profile", element: lazyPage(<MyProfilePage />) },
      { path: "/profiles", element: lazyPage(<ProfileSearchPage />) },
      { path: "/profiles/:id", element: lazyPage(<ProfileDetailPage />) },
      { path: "/projects", element: lazyPage(<ProjectsPage />) },
      { path: "/notifications", element: lazyPage(<NotificationsPage />) },
      { path: "/companies", element: lazyPage(<CompaniesPage />) },
      { path: "/companies/:id", element: lazyPage(<CompanyDetailPage />) },
      { path: "/jobs", element: lazyPage(<JobBoardPage />) },
      { path: "/jobs/:id", element: lazyPage(<JobDetailPage />) },
      {
        path: "/my-applications",
        element: (
          <RoleGuard allow={["user"]}>
            {lazyPage(<MyApplicationsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: "/hr/jobs",
        element: (
          <RoleGuard allow={["hr"]}>
            {lazyPage(<ManageJobsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: "/hr/jobs/:id/applicants",
        element: (
          <RoleGuard allow={["hr"]}>
            {lazyPage(<JobApplicantsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: "/manager/company",
        element: (
          <RoleGuard allow={["manager"]}>
            {lazyPage(<MyCompanyPage />)}
          </RoleGuard>
        ),
      },
      {
        path: "/manager/hr",
        element: (
          <RoleGuard allow={["manager"]}>
            {lazyPage(<ManageHRPage />)}
          </RoleGuard>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <RoleGuard allow={["admin"]}>
            {lazyPage(<UserManagementPage />)}
          </RoleGuard>
        ),
      },
      {
        path: "/admin/companies",
        element: (
          <RoleGuard allow={["admin"]}>
            {lazyPage(<CompanyManagementPage />)}
          </RoleGuard>
        ),
      },
      { path: "/settings", element: lazyPage(<SettingsPage />) },
    ],
  },
]);
