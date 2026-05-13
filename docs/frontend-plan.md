# Quarkus React Frontend Implementation Plan

> **Status:** Approved direction - new React frontend for Quarkus  
> **Created:** 2026-05-12  
> **Phase 1:** DONE - Foundation audited and completed on 2026-05-12  
> **Phase 2:** DONE - Auth module implemented and verified on 2026-05-12  
> **Phase 3:** DONE - Core user area implemented and verified on 2026-05-12  
> **Phase 4:** DONE - Jobs, companies, and notifications implemented and verified on 2026-05-12  
> **Phase 5:** DONE - Role workspaces implemented and verified on 2026-05-13  
> **Phase 6:** DONE - UI/UX, accessibility, and animation polish implemented and verified on 2026-05-13  
> **Phase 7:** DONE - Hardening, E2E, and release quality gate implemented and verified on 2026-05-13  
> **Frontend:** New React app in `client-react/`  
> **Backend:** Quarkus 3.33.1 microservices through gateway `http://localhost:8080`  
> **Out of scope:** Existing Angular `client/` is not reused, migrated, or modified.

---

## Table of Contents

1. [Product Direction](#1-product-direction)
2. [Backend API Contract](#2-backend-api-contract)
3. [Technology Stack](#3-technology-stack)
4. [Folder Structure](#4-folder-structure)
5. [Design System](#5-design-system)
6. [Screen Inventory](#6-screen-inventory)
7. [Component Inventory](#7-component-inventory)
8. [API Client Functions](#8-api-client-functions)
9. [User Flows](#9-user-flows)
10. [Animation Specification](#10-animation-specification)
11. [Role-Based Access Control](#11-role-based-access-control)
12. [State Management](#12-state-management)
13. [Error Handling](#13-error-handling)
14. [Implementation Phases](#14-implementation-phases)
15. [Testing Plan](#15-testing-plan)
16. [Risks and Backend Dependencies](#16-risks-and-backend-dependencies)

---

## 1. Product Direction

This frontend is a brand-new React application for the Quarkus microservice system. It is not connected to the existing Angular `client/` app.

### Goals

- Build a production-quality job platform/workspace UI for users, HR, managers, and admins.
- Use the Quarkus gateway as the only backend entrypoint.
- Cover the full product surface: auth, dashboard, profiles, projects, notifications, companies, jobs, HR tools, manager tools, and admin tools.
- Provide a modern professional UI: responsive, data-dense, fast to scan, accessible, and polished with smooth controlled animation.

### Non-Goals

- Do not migrate Angular files from `client/`.
- Do not reuse Angular services, routes, components, styles, or assets.
- Do not create a marketing landing page for v1.
- Do not implement project image upload or company logo display until the backend exposes durable fields for those features.

### App Entry Behavior

`/` is an app router entry, not a landing page:

- Guest users redirect to `/login`.
- Authenticated users redirect to `/dashboard`.

---

## 2. Backend API Contract

All frontend requests go through:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The React dev server runs on port `3000` by default because the Quarkus gateway CORS config already allows `localhost:3000` and `127.0.0.1:3000`.

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

### Gateway Routes

| Prefix | Service | Port | Current Gateway Policy |
|---|---:|---:|---|
| `/auth/**` | user-service | 8088 | PUBLIC |
| `/users/**` | user-service | 8088 | PROTECTED |
| `/profiles/**` | profile-service | 8085 | PROTECTED |
| `/project/**` | project-service | 8086 | PROTECTED |
| `/manager/**` | manager-service | 8091 | PROTECTED |
| `/notification/**` | notification-service | 8084 | PUBLIC in current gateway config |
| `/image/**` | image-service | 8083 | PUBLIC |

Frontend still sends `Authorization` for notification calls, but backend must protect `/notification` before this data is considered secure.
Role-request and HR-invitation UI added in `client-react` depends on user-specific notifications and role state. Keep `Authorization` on all notification calls, and add `/notification` to `gateway.auth.protected-prefixes` before treating notification data as private in production. `/image` may remain public only for non-sensitive public asset delivery.

### Core Types

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type Role = "admin" | "user" | "hr" | "manager";
export type TypeProfile = "JAVA" | "PYTHON" | "C";
export type TypeJob = "java" | "python" | "php";

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  idEmployee?: string;
  role: Role;
  status?: string;
  active: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserDTO;
}

export interface Contact {
  id?: number;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ProfileDTO {
  id: number;
  objective?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  contact?: Contact;
  typeProfile?: TypeProfile;
  idUser: number;
  url?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDTO {
  id: number;
  title: string;
  description?: string;
  createAt?: string;
  url?: string;
  display: boolean;
  idProfile: number;
}

export interface NotificationDTO {
  id: number;
  message: string;
  createAt?: string;
  url?: string;
  read: boolean;
  idUser: number;
}

export interface CompanyDTO {
  id: number;
  name: string;
  type?: string;
  description?: string;
  street?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  idManager?: number;
  idHR?: number[];
  idJobs?: number[];
}

export interface JobDTO {
  id: number;
  title: string;
  description?: string;
  typeJob?: TypeJob;
  size?: number;
  idProfiePending?: number[];
  idProfile?: number[];
  idCompany: number;
}
```

### Endpoint Summary

#### Auth

| Method | Path | Frontend Function |
|---|---|---|
| POST | `/auth/register` | `authApi.register` |
| POST | `/auth/verify-email` | `authApi.verifyEmail` |
| POST | `/auth/resend-verification-otp` | `authApi.resendVerificationOtp` |
| POST | `/auth/login` | `authApi.login` |
| POST | `/auth/refresh` | `authApi.refresh` |
| POST | `/auth/introspect` | `authApi.introspect` |
| POST | `/auth/logout` | `authApi.logout` |

#### Users

| Method | Path | Frontend Function |
|---|---|---|
| GET | `/users/me` | `usersApi.me` |
| GET | `/users/{id}` | `usersApi.findById` |
| GET | `/users?ids=1&ids=2` | `usersApi.list` |
| PATCH | `/users/{id}` | `usersApi.update` |
| PATCH | `/users/{id}/status` | `usersApi.changeStatus` |
| PATCH | `/users/{id}/role` | `usersApi.changeRole` |
| POST | `/users/admin/accounts` | `usersApi.createAccount` |
| DELETE | `/users/{id}` | `usersApi.delete` |

#### Profiles

| Method | Path | Frontend Function |
|---|---|---|
| GET | `/profiles/me` | `profilesApi.me` |
| POST | `/profiles/me` | `profilesApi.createMe` |
| PATCH | `/profiles/me` | `profilesApi.updateMe` |
| POST | `/profiles/me/avatar` | `profilesApi.updateAvatar` |
| DELETE | `/profiles/me` | `profilesApi.deleteMe` |
| GET | `/profiles?type=&title=&page=&size=` | `profilesApi.search` |
| GET | `/profiles/by-user/{userId}` | `profilesApi.findByUserId` |
| GET | `/profiles/batch?ids=1&ids=2` | `profilesApi.batch` |
| GET | `/profiles/{id}` | `profilesApi.findById` |

#### Projects

| Method | Path | Frontend Function |
|---|---|---|
| POST | `/project/user/save` | `projectsApi.save` |
| POST | `/project/user/update` | `projectsApi.update` |
| GET | `/project/user/getProject?id=` | `projectsApi.getByProfile` |

Project image upload is excluded from v1 UI. Current backend does not persist `imageId` or `imageFile` through normal save/update.

#### Notifications

| Method | Path | Frontend Function |
|---|---|---|
| GET | `/notification/user/findByUser?userId=` | `notificationsApi.findByUser` |
| POST | `/notification/update` | `notificationsApi.markRead` |

Use polling every 30 seconds for notification refresh in v1.

#### Companies

| Method | Path | Frontend Function |
|---|---|---|
| POST | `/manager/admin/company/create` | `companiesApi.create` |
| POST | `/manager/manager/company/update` | `companiesApi.update` |
| POST | `/manager/admin/company/delete?id=` | `companiesApi.delete` |
| PUT | `/manager/manager/sethrtocompany?idCompany=` | `companiesApi.createHrAccountAndAssign` |
| PUT | `/manager/manager/setmaanagertocompany?idCompany=` | `companiesApi.createManagerAccountAndAssign` |
| GET | `/manager/user/company/getbyid?id=` | `companiesApi.getById` |
| GET | `/manager/user/company/getcompany` | `companiesApi.getAll` |
| GET | `/manager/user/company/getcompanybytype?type=` | `companiesApi.getByType` |
| GET | `/manager/company/getcompanybyidmanager?managerId=` | `companiesApi.getByManagerId` |
| GET | `/manager/hr/findByIdHr?id=` | `companiesApi.findByHrId` |

Company create is multipart. Use field name `image` for the file. Do not show company logos in v1 because `CompanyDTO` currently does not expose `url`.

#### Jobs

| Method | Path | Frontend Function |
|---|---|---|
| POST | `/manager/hr/job/create` | `jobsApi.create` |
| POST | `/manager/hr/job/update` | `jobsApi.update` |
| POST | `/manager/hr/job/delete?id=` | `jobsApi.delete` |
| PUT | `/manager/user/job/apply?jobDTO=&idProfile=` | `jobsApi.apply({ jobId, profileId })` |
| PUT | `/manager/hr/job/accept?jobDTO=&idProfile=` | `jobsApi.accept({ jobId, profileId })` |
| PUT | `/manager/hr/job/reject?jobDTO=&idProfile=` | `jobsApi.reject({ jobId, profileId })` |
| GET | `/manager/user/job/findbyid?id=` | `jobsApi.findById` |
| GET | `/manager/user/job/getall` | `jobsApi.getAll` |
| GET | `/manager/user/job/getjobbycompany?id=` | `jobsApi.getByCompany` |
| GET | `/manager/user/job/getjobpending?id=` | `jobsApi.getPendingByProfile` |
| GET | `/manager/user/job/getjobaccepted?id=` | `jobsApi.getAcceptedByProfile` |
| GET | `/manager/user/job/getnewjob?id=` | `jobsApi.getNewForProfile` |

The backend query parameter is named `jobDTO`, but frontend code must expose it as `jobId` to avoid leaking a misleading backend name into UI code.

---

## 3. Technology Stack

| Category | Choice | Decision |
|---|---|---|
| Framework | React 19 + TypeScript | New frontend app, strict typing |
| Build Tool | Vite latest stable | Dev server on port `3000` |
| Styling | Tailwind CSS v4 | Token-based utility styling |
| UI Kit | shadcn/ui | Copyable primitives, accessible defaults |
| Routing | React Router v7 | Layout routes and role guards |
| Server State | TanStack Query v5 | Cache, invalidation, retries |
| Client State | Zustand | Auth and UI-only state |
| Forms | React Hook Form + Zod | Validation and typed form contracts |
| Animation | Framer Motion | Page, modal, drawer, list, layout motion |
| Icons | Lucide React | Consistent icon language |
| Toasts | Sonner | Mutation feedback |
| Tables | TanStack Table v8 | Sorting, filtering, row actions |
| Dates | date-fns | Formatting only |
| Tests | Vitest + Testing Library + Playwright | Unit, integration, and E2E coverage |

### Environment

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_PORT=3000
```

---

## 4. Folder Structure

```text
client-react/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  components.json
  .env.example
  src/
    main.tsx
    App.tsx
    index.css
    lib/
      api-client.ts
      api-error.ts
      query-client.ts
      constants.ts
      routes.ts
      utils.ts
    types/
      api.ts
      auth.ts
      user.ts
      profile.ts
      project.ts
      notification.ts
      company.ts
      job.ts
    stores/
      auth-store.ts
      ui-store.ts
    hooks/
      use-auth.ts
      use-current-user.ts
      use-media-query.ts
      use-reduced-motion.ts
    components/
      ui/
      layout/
        AppShell.tsx
        Sidebar.tsx
        Topbar.tsx
        MobileSidebar.tsx
        Breadcrumbs.tsx
      shared/
        DataTable.tsx
        EmptyState.tsx
        LoadingSkeleton.tsx
        ConfirmDialog.tsx
        StatusBadge.tsx
        AvatarUpload.tsx
        ImageUpload.tsx
        PageHeader.tsx
        SearchInput.tsx
        FilterSelect.tsx
      motion/
        PageTransition.tsx
        FadeIn.tsx
        StaggerList.tsx
        MotionDialog.tsx
    features/
      auth/
      dashboard/
      users/
      profiles/
      projects/
      notifications/
      companies/
      jobs/
      settings/
    routes/
      index.tsx
      RootRedirect.tsx
      ProtectedRoute.tsx
      GuestRoute.tsx
      RoleGuard.tsx
    test/
      mocks/
      setup.ts
```

Rules:

- Do not import from `../client`.
- Feature folders own their API functions, schemas, hooks, pages, and feature components.
- Shared components must stay backend-agnostic.
- API DTO types live in `src/types`.

---

## 5. Design System

The UI should feel like a modern professional SaaS/job platform: focused, polished, fast to scan, and comfortable for repeated daily use.

### Layout

- Desktop: fixed left sidebar, topbar, content area.
- Tablet: collapsible sidebar with preserved icons.
- Mobile: drawer navigation, single-column content, compact cards instead of dense tables.
- No marketing hero or landing section in v1.
- Page sections are full-width layouts with constrained content, not nested cards inside cards.

### Color Tokens

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --destructive: 0 72% 51%;
  --card: 0 0% 100%;
  --popover: 0 0% 100%;
}

.dark {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;
  --muted: 217 33% 14%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 18%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 7%;
  --success: 158 64% 52%;
  --warning: 43 96% 56%;
  --destructive: 0 84% 60%;
  --card: 222 47% 9%;
  --popover: 222 47% 9%;
}
```

### Typography

- Font: Inter.
- Body: 14px for app surfaces.
- Small metadata: 12px.
- Section headings: 18-24px.
- Page headings: 24-30px.
- Do not scale font size with viewport width.
- Letter spacing remains `0`.

### Components

- Buttons use icons where actions are standard: create, edit, delete, save, search, filter, refresh.
- Tables have sticky headers, row hover, row actions, empty state, loading skeleton, and mobile card fallback.
- Dialogs are used for confirmations and compact forms.
- Sheets/drawers are used for detail panels and mobile navigation.
- Forms show inline field errors and a top-level submit error.
- Toasts are short and action-oriented.

### UX States

Every page must define:

- Loading state with stable skeleton dimensions.
- Empty state with a direct CTA when possible.
- Error state with retry.
- Permission denied state for role mismatch.
- Mobile layout.

---

## 6. Screen Inventory

### Public / Guest

| # | Screen | Route | Notes |
|---:|---|---|---|
| 1 | Root Redirect | `/` | Guest to `/login`, auth to `/dashboard` |
| 2 | Login | `/login` | Email/password |
| 3 | Register | `/register` | Creates pending account |
| 4 | Verify Email | `/verify-email` | OTP verification |

### All Authenticated Roles

| # | Screen | Route | Notes |
|---:|---|---|---|
| 5 | Dashboard | `/dashboard` | Role-aware overview |
| 6 | My Profile | `/profile` | Create/edit own profile |
| 7 | Profile Search | `/profiles` | Filter by type/title |
| 8 | Profile Detail | `/profiles/:id` | Read-only detail |
| 9 | My Projects | `/projects` | Project CRUD except delete |
| 10 | Notifications | `/notifications` | List and mark read |
| 11 | Job Board | `/jobs` | Browse/filter jobs |
| 12 | Job Detail | `/jobs/:id` | Apply or view details |
| 13 | Company List | `/companies` | Browse/filter companies |
| 14 | Company Detail | `/companies/:id` | Company and jobs |
| 15 | Settings | `/settings` | Theme/session preferences |

### User Role

| # | Screen | Route | Notes |
|---:|---|---|---|
| 16 | My Applications | `/my-applications` | Pending and accepted jobs |

### HR Role

| # | Screen | Route | Notes |
|---:|---|---|---|
| 17 | Manage Jobs | `/hr/jobs` | Create/update/delete jobs |
| 18 | Review Applicants | `/hr/jobs/:id/applicants` | Accept/reject applicants |

### Manager Role

| # | Screen | Route | Notes |
|---:|---|---|---|
| 19 | My Company | `/manager/company` | Company owned by manager |
| 20 | Manage HR | `/manager/hr` | Create HR account and assign |

### Admin Role

| # | Screen | Route | Notes |
|---:|---|---|---|
| 21 | User Management | `/admin/users` | User role/status/account tools |
| 22 | Company Management | `/admin/companies` | Create/delete companies, create manager account |

---

## 7. Component Inventory

### Layout

- `AppShell`
- `Sidebar`
- `Topbar`
- `MobileSidebar`
- `Breadcrumbs`
- `RootRedirect`

### Shared

- `DataTable`
- `EmptyState`
- `LoadingSkeleton`
- `ConfirmDialog`
- `StatusBadge`
- `AvatarUpload`
- `ImageUpload`
- `PageHeader`
- `SearchInput`
- `FilterSelect`
- `FormSection`
- `PermissionDenied`
- `RetryState`
- `ResponsiveActionBar`

### Motion

- `PageTransition`
- `FadeIn`
- `StaggerList`
- `MotionDialog`
- `MotionDrawer`

### Feature Components

- Auth: `LoginForm`, `RegisterForm`, `VerifyEmailForm`, `OtpInput`
- Dashboard: `StatsCard`, `QuickActions`, `RecentActivity`, `ProfileCompletionCard`
- Users: `UsersTable`, `UserDetailSheet`, `CreateUserDialog`, `ChangeRoleDialog`, `ChangeStatusDialog`
- Profiles: `ProfileForm`, `ProfileCard`, `ProfileGrid`, `AvatarEditor`, `ContactFields`
- Projects: `ProjectForm`, `ProjectCard`, `ProjectGrid`
- Notifications: `NotificationBell`, `NotificationDropdown`, `NotificationItem`
- Companies: `CompanyForm`, `CompanyCard`, `CompanyGrid`, `CompanyDetailPanel`, `CreateCompanyDialog`, `CreateHrAccountDialog`, `CreateManagerAccountDialog`
- Jobs: `JobForm`, `JobCard`, `JobGrid`, `ApplicantsList`, `ApplicantActions`, `ApplicationStatusBadge`

---

## 8. API Client Functions

### API Client Rules

- `api-client.ts` owns the Axios instance.
- All functions return `Promise<ApiResponse<T>>`.
- Hooks select `.data` for component consumption.
- Mutations invalidate only related query keys.
- Refresh token retry happens once per failed request.
- On refresh failure, clear session and redirect to `/login`.

### Functions

```ts
authApi.register(input)
authApi.verifyEmail(input)
authApi.resendVerificationOtp(input)
authApi.login(input)
authApi.refresh(refreshToken)
authApi.introspect(token)
authApi.logout()

usersApi.me()
usersApi.findById(id)
usersApi.list(ids)
usersApi.update(id, input)
usersApi.changeStatus(id, input)
usersApi.changeRole(id, input)
usersApi.createAccount(input)
usersApi.delete(id)

profilesApi.me()
profilesApi.createMe(input)
profilesApi.updateMe(input)
profilesApi.updateAvatar(file)
profilesApi.deleteMe()
profilesApi.search(params)
profilesApi.findByUserId(userId)
profilesApi.batch(ids)
profilesApi.findById(id)

projectsApi.save(input)
projectsApi.update(input)
projectsApi.getByProfile(profileId)

notificationsApi.findByUser(userId)
notificationsApi.markRead(notification)

companiesApi.create(formData)
companiesApi.update(input)
companiesApi.delete(id)
companiesApi.createHrAccountAndAssign(companyId, accountInput)
companiesApi.createManagerAccountAndAssign(companyId, accountInput)
companiesApi.getById(id)
companiesApi.getAll()
companiesApi.getByType(type)
companiesApi.getByManagerId(managerId)
companiesApi.findByHrId(hrId)

jobsApi.create(input)
jobsApi.update(input)
jobsApi.delete(id)
jobsApi.apply({ jobId, profileId })
jobsApi.accept({ jobId, profileId })
jobsApi.reject({ jobId, profileId })
jobsApi.findById(id)
jobsApi.getAll()
jobsApi.getByCompany(companyId)
jobsApi.getPendingByProfile(profileId)
jobsApi.getAcceptedByProfile(profileId)
jobsApi.getNewForProfile(profileId)
```

---

## 9. User Flows

### Register -> Verify Email -> Dashboard

```text
/register
  -> POST /auth/register
  -> /verify-email
  -> POST /auth/verify-email
  -> store AuthSession
  -> /dashboard
```

### Login -> Dashboard

```text
/login
  -> POST /auth/login
  -> store AuthSession
  -> /dashboard
```

### Profile Completion

```text
/dashboard
  -> profile completion card
  -> /profile
  -> POST /profiles/me or PATCH /profiles/me
  -> optional POST /profiles/me/avatar
```

### Job Application

```text
/jobs
  -> filter/search
  -> /jobs/:id
  -> Apply
  -> PUT /manager/user/job/apply?jobDTO={jobId}&idProfile={profileId}
  -> invalidate applications and job queries
  -> toast success
```

### HR Review Applicants

```text
/hr/jobs
  -> select job
  -> /hr/jobs/:id/applicants
  -> accept or reject
  -> PUT /manager/hr/job/accept or /manager/hr/job/reject
  -> invalidate job applicant queries
```

### Admin Company Setup

```text
/admin/companies
  -> Create company with multipart form
  -> POST /manager/admin/company/create
  -> Create manager account and assign
  -> PUT /manager/manager/setmaanagertocompany?idCompany={companyId}
```

### Manager HR Setup

```text
/manager/hr
  -> Create HR account and assign to company
  -> PUT /manager/manager/sethrtocompany?idCompany={companyId}
```

---

## 10. Animation Specification

Animation must make the app feel fast and polished. It must never hide latency, block interaction, or create layout instability.

### Global Rules

- Respect `prefers-reduced-motion`.
- UI interaction animation: 120-220ms.
- Page transition: max 300ms.
- Exit animation: max 180ms.
- Do not animate large lists with more than 20 staggered children.
- Do not animate font size.
- Do not use decorative gradient orbs or bokeh backgrounds.

### Motion Tokens

```ts
export const motionDurations = {
  fast: 0.12,
  base: 0.18,
  page: 0.22,
  slow: 0.3,
};

export const motionEase = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.16, 1, 0.3, 1],
};
```

### Page Transition

- Initial: `opacity: 0`, `y: 8`.
- Animate: `opacity: 1`, `y: 0`.
- Exit: `opacity: 0`, `y: -4`.
- Duration: `220ms`.
- Apply once per route content area.

### Modal

- Overlay: fade in/out `150ms`.
- Panel: `scale 0.98 -> 1`, `opacity 0 -> 1`, duration `180ms`.
- Focus moves into modal on open and returns to trigger on close.

### Drawer and Mobile Sidebar

- Slide from left: `x -100% -> 0`.
- Use spring with controlled stiffness, no exaggerated bounce.
- Backdrop fade `150ms`.

### Dropdowns and Popovers

- `opacity 0 -> 1`.
- `scale 0.98 -> 1`.
- Duration `120-160ms`.
- Transform origin follows trigger position.

### Lists and Cards

- Stagger only first 20 visible items.
- Delay per item: `0.035s`.
- Card hover: border/shadow change and `translateY(-1px)` max.
- Table row hover: background color transition only.

### Sidebar

- Collapse/expand duration: `180ms`.
- Width transition only; labels fade after width begins changing.
- Active nav indicator moves with layout animation.

### Loading

- Skeletons keep final layout dimensions.
- Table skeleton keeps row height stable.
- Upload progress uses a linear progress bar and thumbnail fade-in after success.

---

## 11. Role-Based Access Control

Frontend RBAC is for navigation, UX, and early feedback. Backend must still enforce authorization for sensitive actions.

| Feature | user | hr | manager | admin |
|---|---:|---:|---:|---:|
| Dashboard | yes | yes | yes | yes |
| My profile CRUD | yes | yes | yes | yes |
| Browse profiles | yes | yes | yes | yes |
| My projects | yes | yes | yes | yes |
| Notifications | yes | yes | yes | yes |
| Browse companies | yes | yes | yes | yes |
| Browse jobs | yes | yes | yes | yes |
| Apply to jobs | yes | no | no | no |
| My applications | yes | no | no | no |
| Create/edit/delete jobs | no | yes | no | no |
| Accept/reject applicants | no | yes | no | no |
| Edit own company | no | no | yes | no |
| Create HR account and assign | no | no | yes | no |
| Create/delete company | no | no | no | yes |
| Create manager account and assign | no | no | no | yes |
| User management | no | no | no | yes |

### Sidebar

All roles:

- Dashboard
- My Profile
- Profile Search
- My Projects
- Notifications
- Companies
- Job Board
- Settings

User:

- My Applications

HR:

- Manage Jobs
- Review Applicants

Manager:

- My Company
- Manage HR

Admin:

- User Management
- Company Management

---

## 12. State Management

### Auth Store

Zustand stores only client auth/session state.

```ts
interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  updateUser: (user: UserDTO) => void;
  logout: () => void;
}
```

Persist auth state in localStorage. Do not persist server query data in Zustand.

### UI Store

```ts
interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  setTheme: (theme: UIState["theme"]) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}
```

### Query Keys

```ts
["auth", "me"]
["users", "list", ids]
["profile", "me"]
["profiles", "search", params]
["projects", "profile", profileId]
["notifications", "user", userId]
["companies", "all"]
["companies", "detail", companyId]
["jobs", "all"]
["jobs", "detail", jobId]
["jobs", "pending", profileId]
["jobs", "accepted", profileId]
```

---

## 13. Error Handling

### Error Extraction

```ts
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
    if (body?.message) return body.message;
    if (error.response?.status === 401) return "Session expired";
    if (error.response?.status === 403) return "Access denied";
    if (error.response?.status === 404) return "Not found";
    if (error.response?.status && error.response.status >= 500) return "Server error";
  }
  return "Something went wrong";
}
```

### Display Rules

1. Field validation errors appear below fields.
2. Submit-level form errors appear above the submit button or form body.
3. Mutation success/error uses Sonner toast.
4. Page query errors show retry state.
5. 401 after refresh failure logs out and redirects to `/login`.
6. 403 renders permission denied page or disables action with tooltip.

---

## 14. Implementation Phases

Full polished app timeline: **5-7 weeks** for one developer.  
Usable MVP timeline: **3-4 weeks** if polish and broad tests are reduced.

### Phase 1: Foundation

**Status: DONE.**

Acceptance date: `2026-05-12`.

Verification commands:

```powershell
cd client-react
npm run lint
npm run build
```

Verification result:

- `npm run lint` passed.
- `npm run build` passed.
- Build warning remains acceptable for Phase 1: the initial application chunk is slightly over `500 kB`; code splitting belongs to Phase 6/7 hardening after real feature routes exist.

Completed scope:

- Scaffolded `client-react/` as an independent React application.
- Configured Vite dev server on port `3000`.
- Added React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, TanStack Query v5, Zustand, Axios, Framer Motion, Sonner, Lucide, and date-fns.
- Enabled path alias `@/*` to `src/*`.
- Added strict TypeScript settings in the active project config.
- Added Inter font and shared CSS variables for light/dark theme tokens.
- Added `.env.example` with `VITE_API_BASE_URL=http://localhost:8080` and `VITE_APP_PORT=3000`.
- Added `components.json` and `src/components/ui/` baseline so shadcn/ui components can be added consistently.
- Added `api-client.ts`, `api-error.ts`, `query-client.ts`, and `constants.ts`.
- Wired Axios to `VITE_API_BASE_URL` instead of relying on an implicit relative base URL.
- Added auth/session and UI Zustand stores.
- Added root router, guest guard, protected guard, and role guard.
- Built the first AppShell with desktop sidebar, mobile drawer, topbar, theme menu, logout action, page transition, and role-aware navigation.
- Added placeholder pages for the planned protected route surface so navigation can be tested before feature implementation.
- Removed corrupted placeholder glyphs from the current UI.

Senior review notes:

- Phase 1 is sufficient to start Phase 2. The app has a stable shell, route structure, state providers, API transport, theme foundation, and build verification.
- Demo login is intentionally still a temporary stub. Replacing it with real `/auth/login`, `/auth/register`, OTP verification, refresh-token handling, and submit validation is Phase 2 work.
- The current `RoleGuard` is a UX/navigation guard only. It must not be treated as a security boundary; Quarkus services and gateway policies remain the real authorization layer.
- Feature DTO modules such as `profile.ts`, `project.ts`, `company.ts`, and `job.ts` are still created during their feature phases, when each API wrapper is implemented.
- Shared production components such as `DataTable`, `ConfirmDialog`, `LoadingSkeleton`, `RetryState`, and form primitives are intentionally deferred to Phase 3 and later, where their API and UX requirements become concrete.
- Keep all future frontend requests going through the gateway base URL. Do not call individual Quarkus service ports directly from React.

### Phase 2: Auth

**Status: DONE.**

Acceptance date: `2026-05-12`.

Verification commands:

```powershell
cd client-react
npm run lint
npm run test:run
npm run build
```

Verification result:

- `npm run lint` passed.
- `npm run test:run` passed: 5 test files, 13 tests.
- `npm run build` passed.
- Build warning remains acceptable for this phase: the current single app chunk is over `500 kB`; route-level code splitting belongs to Phase 6/7 hardening after the main feature routes are implemented.

Completed scope:

- Replaced the temporary demo login with real `/auth/login`.
- Added public registration through `/auth/register` without sending forbidden `role` or `employeeId` fields.
- Added email verification through `/auth/verify-email`.
- Added resend OTP through `/auth/resend-verification-otp` with a 60-second client cooldown.
- Added logout through `/auth/logout`; client session is cleared even if the backend logout request fails.
- Added auth API wrappers, request/response types, Zod schemas, and TanStack Query mutations.
- Added React Hook Form validation for login, register, and verify-email forms.
- Added password visibility toggle and password strength checklist matching backend rules.
- Added 6-digit OTP input with digit filtering, paste support, auto-focus, backspace behavior, and loading/error states.
- Persisted session data in localStorage: access token, refresh token, user, and access-token expiry seconds.
- Added `hasHydrated` to prevent route guards from redirecting before localStorage restore completes.
- Added single-flight refresh-token handling for protected API calls that return `401`.
- Added refresh exclusions for auth endpoints to prevent retry loops.
- Added query-cache clearing and login redirect when refresh fails.
- Wired `/login`, `/register`, and `/verify-email` to real pages.
- Updated `GuestRoute`, `ProtectedRoute`, and `RootRedirect` to wait for auth hydration.
- Updated `RoleGuard` to render a permission-denied state instead of silently redirecting.
- Replaced topbar local-only logout with the real logout mutation.
- Added responsive, animated auth UI with reduced-motion support.
- Added tests for schemas, auth store hydration/logout, API error extraction, OTP input behavior, and route guards.

Senior review notes:

- Phase 2 is sufficient to start Phase 3. The auth module now uses the real Quarkus user-service contract through the gateway.
- Forgot-password and social login remain out of scope because the backend does not expose those flows.
- Tokens are still stored in localStorage by design for this frontend phase. Moving to httpOnly cookies requires a backend contract change.
- Frontend role guards are still UX guards only; backend services must continue enforcing authorization.

### Phase 3: Core User Area

**Status: DONE.**

Acceptance date: `2026-05-12`.

Verification commands:

```powershell
cd client-react
npm run lint
npm run test:run
npm run build
```

Verification result:

- `npm run lint` passed.
- `npm run test:run` passed: 10 test files, 25 tests.
- `npm run build` passed after rerunning outside the sandbox because the Windows sandbox blocks the Tailwind native binary with `spawn EPERM`.
- Build warning remains acceptable for this phase: the current app chunk is still over `500 kB`; route-level code splitting belongs to Phase 6/7 hardening.

Completed scope:

- Replaced Phase 3 placeholders with real `/dashboard`, `/profile`, `/profiles`, `/profiles/:id`, and `/projects` pages.
- Added Profile DTO/types, Project DTO/types, Zod schemas, API wrappers, TanStack Query hooks, and mutations.
- Implemented `/profiles/me` create/update/delete, `/profiles/me/avatar` multipart upload with field `image`, profile search, and profile detail.
- Implemented project list/create/update through `/project/user/getProject`, `/project/user/save`, and `/project/user/update`.
- Kept project delete and project image upload out of scope because the backend does not expose stable product endpoints for them.
- Added shared `PageHeader`, `LoadingSkeleton`, `EmptyState`, `RetryState`, `ConfirmDialog`, `StatusBadge`, `AvatarUpload`, and motion helpers.
- Upgraded dashboard to use real session/profile/project data, profile completion, role-aware stats, quick actions, and recent activity.
- Added missing-profile onboarding so `PROFILE_NOT_FOUND` from `/profiles/me` becomes a normal create-profile flow.
- Added responsive card/grid UI for profile search, profile detail projects, and my projects.
- Added controlled Framer Motion transitions with reduced-motion support.
- Added focused tests for Phase 3 schemas, API wrapper contracts, and shared state components.

Senior review notes:

- Phase 3 is sufficient to start Phase 4. The authenticated user area now has real profile/project data flows and reusable UX primitives.
- `PROFILE_NOT_FOUND` is intentionally handled as "profile not created yet" for self-profile screens.
- The project service still has no delete endpoint; do not add a fake UI delete action until backend support exists.
- Project image compatibility endpoints remain unused because normal project save/update does not persist project images reliably.
- Profile and project pages are implemented as card/grid experiences rather than tables because the current backend returns simple lists without total-count metadata.

### Phase 4: Jobs, Companies, Notifications

**Status: DONE.**

Acceptance date: `2026-05-12`.

Verification commands:

```powershell
cd client-react
npm run lint
npm run test:run
npm run build
```

Verification result:

- `npm run lint` passed.
- `npm run test:run` passed: 17 test files, 39 tests.
- `npm run build` passed after rerunning outside the sandbox because the Windows sandbox blocks the Tailwind native binary with `spawn EPERM`.
- Build warning remains acceptable for this phase: the current app chunk is over `500 kB`; route-level code splitting belongs to Phase 6/7 hardening.

Completed scope:

- Replaced Phase 4 placeholders with real `/notifications`, `/jobs`, `/jobs/:id`, `/my-applications`, `/companies`, and `/companies/:id` pages.
- Added Notification, Job, and Company DTO types, API wrappers, TanStack Query hooks, cache keys, and helper utilities.
- Added notification bell in the topbar with unread badge, latest-notifications dropdown, mark-read action, and 30-second polling.
- Added full notifications page with All/Unread/Read filters, mark-read actions, loading/empty/retry states.
- Added job board with client-side search, type filter, company filter, open-only filter, and card grid.
- Added job detail page with company summary and role/profile-aware apply panel.
- Added real apply mutation through `/manager/user/job/apply?jobDTO=&idProfile=`.
- Added user-only my applications page with pending and accepted tabs.
- Added company list with client-side search, type filter, location filter, and company cards.
- Added company detail page with company contact/location summary and jobs loaded by company id.
- Kept HR accept/reject, job management, company management, and manager/admin assignment flows for Phase 5.
- Added focused tests for Phase 4 API wrapper contracts, notification/job/company helpers, and job card status rendering.

Senior review notes:

- Phase 4 is sufficient to start Phase 5. Marketplace browsing, user applications, company discovery, and notifications are now real frontend flows.
- `idProfiePending` remains isolated to the DTO/helper boundary; UI copy uses normal "pending application" language.
- Notification security remains a backend concern because the gateway currently exposes `/notification` publicly. The frontend still sends auth headers.
- Company logos remain out of scope because `CompanyDTO` does not expose a stable `url`.
- Job withdraw/cancel remains out of scope because backend does not expose an endpoint.

### Phase 5: Role Workspaces

**Status:** DONE on 2026-05-13.

Verification:

- `npm run lint` passed.
- `npm run test:run` passed: 19 test files, 46 tests.
- `npm run build` passed.
- Build warning remains: the generated JS chunk is larger than 500 kB. This is acceptable for Phase 5 and should be handled with route-level code splitting in Phase 6/7.

Completed:

- HR workspace:
  - `/hr/jobs` now loads the company assigned to the HR account.
  - HR can create, edit, and delete jobs for that company.
  - `/hr/jobs/:id/applicants` reviews pending/accepted applicants.
  - HR can accept/reject applicants through backend endpoints.
  - Foreign-company job review renders a permission state.

- Manager workspace:
  - `/manager/company` now loads and edits the manager-owned company.
  - `/manager/hr` creates HR accounts and assigns them to the manager company.
  - HR user ids are displayed because the backend only allows admin to read user lists.

- Admin workspace:
  - `/admin/users` now lists users, filters users, creates internal accounts, edits profile fields, changes roles, and deactivates accounts.
  - Self-deactivation is blocked in UI.
  - `/admin/companies` now lists companies, creates companies with multipart `image`, edits companies, deletes companies, and creates/assigns manager accounts.

Senior notes:

- Backend typo query names such as `jobDTO` and `setmaanagertocompany` are hidden behind clean frontend function names.
- Company/job update flows preserve relationship fields such as `idManager`, `idHR`, `idJobs`, `idCompany`, `idProfiePending`, and `idProfile`.
- `/settings` was intentionally left for the polish phase at Phase 5 time and was replaced with a real settings page in Phase 6.
- Company logo display remains out of scope because `CompanyDTO` still does not expose a stable `url`.

### Phase 6: UI/UX and Animation Polish

**Status:** DONE on 2026-05-13.

Verification:

- `npm run lint` passed.
- `npm run test:run` passed.
- `npm run build` passed.

Completed:

- Replaced `/settings` placeholder with a real settings page.
- Added route-level lazy loading and Suspense fallback.
- Removed the production chunk-size warning by splitting page bundles.
- Centralized motion presets for page, dialog, dropdown, fade, and stagger behavior.
- Updated app route transitions to respect reduced-motion preferences.
- Added skip-to-content navigation and focus target support for the app shell.
- Improved dialog accessibility with Escape close, overlay close, focus restore, and aria description wiring.
- Improved topbar menus with `aria-expanded`, `aria-controls`, menu roles, and Escape close.
- Improved notification dropdown semantics and reduced-motion animation handling.
- Improved mobile sidebar keyboard close behavior and reduced-motion handling.
- Persisted desktop sidebar collapsed preference in localStorage.
- Updated system theme behavior so OS theme changes are reflected while the app is in `system` mode.
- Improved shared table accessibility with sortable column labels, `aria-sort`, and a stronger empty state.
- Added focused tests for dialog keyboard behavior, DataTable accessibility, Topbar menu accessibility, and Settings theme/sidebar behavior.

Senior notes:

- Phase 6 is a polish and hardening pass, not a backend feature phase.
- The frontend still does not promise company logos or project image upload because backend DTOs do not expose stable fields.
- Full browser screenshot regression and E2E automation remain Phase 7 work.

### Phase 7: Hardening

**Status:** DONE on 2026-05-13.

Verification:

- `npm run quality` passed.
- Quality gate includes:
  - `npm run lint`
  - `npm run test:run`: 27 test files, 69 tests.
  - `npm run test:e2e`: 16 Playwright tests.
  - `npm run build`

Completed:

- Added Playwright E2E tooling and scripts:
  - `test:e2e`
  - `test:e2e:ui`
  - `test:e2e:headed`
  - `quality`
- Added deterministic mock-gateway E2E fixtures for `user`, `hr`, `manager`, and `admin`.
- Added E2E coverage for:
  - Guest protected-route redirect.
  - Login and session restore.
  - Role-aware navigation and permission state.
  - Missing-profile onboarding.
  - Job board filtering and apply flow.
  - Notification mark-read flow.
  - HR unassigned-company state.
  - HR job create/delete flow.
  - Admin self-deactivate guard.
  - Topbar keyboard Escape behavior.
  - Dashboard responsive overflow checks at `320`, `390`, `768`, `1024`, and `1440`.
- Added schema tests for jobs, companies, and admin users.
- Added `ui-store` tests for theme persistence and sidebar collapsed persistence.
- Added API client interceptor tests for bearer auth, single-flight refresh, and auth-endpoint refresh exclusion.
- Added component/guard hardening tests for `RoleGuard`, `DataToolbar`, `ManagementDialog`, and `NotificationBell`.
- Updated Vite proxy matching so app routes such as `/notifications` and role workspace routes are not accidentally proxied to the backend during dev refreshes.
- Fixed the mobile topbar at `320px` by reducing small-screen chrome width and hiding the JavaNC text below `380px`.
- Added Playwright artifact ignores for `test-results`, `playwright-report`, and browser cache output.

Release checklist:

- Confirm `.env` or runtime environment sets `VITE_API_BASE_URL=http://localhost:8080`.
- Confirm Quarkus gateway and dependent services are available for manual backend smoke tests.
- Run `npm ci` on a clean checkout before release validation.
- Run `npm run quality`.
- Manually verify real-backend flows:
  - Register -> verify OTP -> dashboard.
  - Profile create/update/avatar upload.
  - Project create/update.
  - Job apply -> HR accept/reject.
  - Manager company update -> create HR account.
  - Admin create company -> assign manager.
  - Notification mark read persists after refetch.
- Manually verify keyboard-only navigation, reduced motion, and responsive widths `320`, `390`, `768`, `1024`, `1440`.

Senior notes:

- Default E2E is mock-based for repeatability and does not require live Quarkus services.
- Real-backend acceptance remains a manual release gate until the backend provides stable seeded test data.
- On Windows, Tailwind and Playwright native binaries may require running `test:run`, `test:e2e`, `build`, or `quality` outside restricted sandboxes.

---

## 15. Testing Plan

### Unit and Component

- Auth store persistence and logout.
- API error extraction.
- Role guard matrix.
- Login/register/verify/profile/company/job form schemas.
- Shared components: DataTable, ConfirmDialog, EmptyState, LoadingSkeleton.

### Integration

- Login -> dashboard.
- Register -> verify email -> dashboard.
- Profile create/update/avatar upload.
- Project create/update/list.
- Job apply -> pending application.
- HR accept/reject applicant.
- Admin create company.
- Manager create HR account and assign.
- Admin create manager account and assign.

### E2E

- Guest cannot open protected pages.
- Role users do not see forbidden nav/actions.
- 401 refresh retry works once.
- Refresh failure logs out.
- Responsive screenshots: 320, 390, 768, 1024, 1440.
- Reduced motion disables page/list/modal motion.

---

## 16. Risks and Backend Dependencies

### Security

- `/notification` is public in current gateway config. Backend should add `/notification` to protected prefixes before production.
- Frontend RBAC is not a security boundary. Backend should enforce roles on admin/hr/manager endpoints.

### API Shape

- `jobDTO` query param actually means `jobId`. Frontend must hide this behind `jobsApi.apply({ jobId, profileId })`.
- `sethrtocompany` and `setmaanagertocompany` create accounts and assign them. UI labels must say "Create HR account" and "Create manager account", not "select existing user".
- `setmaanagertocompany` endpoint name has a backend typo. Frontend API wrapper should use a clean function name.

### Media

- Company create accepts `image`, but `CompanyDTO` does not expose `url`; v1 should not promise visible company logos.
- Project save/update do not persist project images; v1 should not include project image upload.
- Profile avatar upload is supported through `/profiles/me/avatar`.

### Data Scale

- Many list endpoints do not provide server-side pagination. Use client-side pagination/filtering for v1 and keep page size modest.

### Delivery

- Full polished 22-screen implementation is a multi-week project. Prioritize working flows first, then animation and polish.
