# Frontend Next.js Tailwind Plan

## Goal

Rewrite the current Angular client in `client/` as a new Next.js frontend using Tailwind CSS while preserving the user-facing product flows and the backend API behavior documented for the Quarkus migration.

This is a frontend plan only. Do not modify `client/`, `microservice/`, or `quarkus/` during planning work.

## Source Of Truth

Use these sources before implementation:

- `client/` for existing routes, screens, models, form behavior, local storage keys, and API usage.
- `docs/codex/06-api-contract.md` for backend endpoint compatibility.
- `docs/codex/08-security-contract.md` for authentication and token behavior.
- `quarkus/` for the current Quarkus service implementation status.
- `microservice/` only when the Quarkus behavior or docs are unclear.

The new frontend must preserve current backend contract names first. Cleanup of API names, token query parameters, multipart fields, or route security should be planned separately after backend compatibility is stable.

## Recommended Target Location

Create the new frontend separately from the Angular app:

```text
frontend/
  app/
  components/
  features/
  lib/
  types/
  public/
```

Keep `client/` available as the behavior reference until the Next.js implementation reaches functional parity.

## Platform

Use:

- Next.js with the App Router.
- TypeScript.
- Tailwind CSS.
- React Hook Form for larger forms.
- Zod for form validation and API response validation where useful.
- A small typed API client built on `fetch`.
- Playwright for critical browser flows.

Avoid introducing a broad state-management library in the first pass. Use React state, server/client component boundaries, and small feature hooks first. Add Zustand or another store only if duplicated cross-page state becomes a real problem.

## Backend Access Strategy

The current Angular client calls the gateway at `http://localhost:8080`. The Next.js app should keep that default:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

All browser-facing calls should use a central API helper:

```text
lib/api/client.ts
lib/api/endpoints.ts
lib/api/types.ts
```

The helper must:

- Prefix requests with `NEXT_PUBLIC_API_BASE_URL`.
- Read the auth token from the chosen client storage.
- Send `Authorization: Bearer <token>` for protected routes.
- Preserve the `ApiResponse<T>` shape: `success`, `message`, `data`.
- Redirect or clear auth state on `401`.
- Let multipart requests omit `Content-Type` so the browser sets boundaries.

## Auth And Session Plan

Current Angular behavior:

- Stores token in `localStorage` key `authToken`.
- Stores current user in `localStorage` key `userCurrent`.
- Redirects to `/login` on `401`.
- Some user endpoints still pass `token` as a query parameter.

Baseline Next.js behavior:

- Preserve compatibility with `authToken` and `userCurrent` during initial parity.
- Build a single auth client module for signin, signup, current user, update, logout, and role checks.
- Add route guards in client layouts for protected route groups.
- Keep token query parameters only where the backend currently requires them.

Post-baseline hardening:

- Move from `localStorage` to HTTP-only cookies only after the gateway and auth service support the change.
- Remove token query parameters only after the backend contract changes.

## Route Map

Map Angular routes to Next.js App Router routes:

| Current Angular route | Next.js route | Purpose |
|---|---|---|
| `/home` | `/` or `/home` | Landing/home dashboard |
| `/login` | `/login` | Sign in |
| `/register` | `/register` | Sign up |
| `/profile/create` | `/profile/create` | Create or edit user profile |
| `/profile/list-profiles` | `/profiles` | Browse profiles |
| `/profile/profile-user/:id` | `/profiles/[id]` | Profile details |
| `/job-list` | `/jobs` | Browse jobs |
| `/job-details/:id` | `/jobs/[id]` | Job details and apply |
| `/list-project` | `/projects` | Project list |
| `/user` | `/account` | Current user/account page |
| `/admin/list-user` | `/admin/users` | Admin user management |
| `/admin/list-company` | `/admin/companies` | Admin company management |
| `/manager/job` | `/manager/jobs` | Manager or HR job management |
| `/manager/emloyee` | `/manager/employees` | Employee list; keep old typo only as redirect if needed |
| `/manager/hr` | `/manager/hr` | HR assignment and review |
| `/manager/about` | `/manager/company` | Company profile |
| `/manager/profile/profile-user/:id` | `/manager/profiles/[id]` | Manager profile view |

Add redirects from old URLs to the new cleaner URLs only after primary routes work.

## Feature Modules

Organize by product domain rather than by technical component type:

```text
features/auth/
features/users/
features/profiles/
features/projects/
features/jobs/
features/companies/
features/notifications/
features/admin/
features/manager/
```

Each feature should own:

- API functions for its endpoint family.
- TypeScript types for request and response data.
- Form schemas.
- UI components used only by that feature.
- Route-level loading, empty, and error states.

Shared UI belongs in:

```text
components/ui/
components/layout/
components/forms/
```

## API Endpoint Coverage

Implement API modules that match backend route families:

| Frontend module | Backend base path | Required flows |
|---|---|---|
| `authApi` | `/auth` | signup, signin, update, updateactive, delete, findbyid, getCurrentUser, getAll, getlistuserbyid |
| `profileApi` | `/profile` | create/update multipart profile, list profiles, filter by type/title, find by id/user id |
| `projectApi` | `/project` | save/update project, list projects by profile |
| `imageApi` | `/image` | upload image |
| `notificationApi` | `/notification` | create, update, list by user |
| `companyApi` | `/manager` | create/update/delete company, assign HR/manager, list/filter companies |
| `jobApi` | `/manager` | create/update/delete job, apply, accept, reject, list by company/status |

Keep DTO field names compatible with the backend. Important current fields include:

- `AuthenticationResponse.isVaild` with the existing typo.
- `User.id`, `name`, `email`, `password`, `confirmPassword`, `active`, `role`, `idEmployee`.
- `Profile.id`, `objective`, `education`, `workExperience`, `skills`, `typeProfile`, `idUser`, `url`, `title`, `contact`.
- `Project.id`, `title`, `description`, `createAt`, `url`, `imageId`, `display`, `idProfile`.
- `Company.id`, `name`, `type`, `description`, `street`, `email`, `phone`, `city`, `country`, `idManager`, `idHR`, `idJobs`, `image`.
- `Job.id`, `title`, `description`, `typeJob`, `size`, `idProfiePending`, `idProfile`, `idCompany`.
- `Notification.id`, `message`, `createAt`, `url`, `idUser`, `read`.

## Compatibility Traps To Resolve Early

Verify these before implementing affected screens:

- Angular `ImageServiceService` uploads multipart field `imageFile`, while the API contract and Quarkus image service expect `image`.
- Angular `ProjectServiceService.getProjectByUser` calls `http://localhost:8088/project/getByUser`, which does not match the documented gateway path.
- Angular `ContactServiceService` calls `/contact/**`, but the documented backend route families do not include a contact service; contact data appears embedded under profile.
- Several flows pass token as query parameter and also send `Authorization`; preserve only where the endpoint currently needs it.
- `manager/emloyee` is misspelled in Angular routes; use a clean route and optional redirect.
- Job fields include `idProfiePending` typo; preserve the backend field until the API is intentionally changed.

## UI And Tailwind Direction

Use Tailwind to create a cleaner operational UI, not a marketing site.

Design principles:

- Use dense but readable layouts for admin, manager, job, company, and profile management.
- Keep cards for repeated entities such as jobs, profiles, companies, notifications, and users.
- Prefer tables or compact lists for admin management screens.
- Use shared form controls for text inputs, selects, textareas, file uploads, switches, and submit buttons.
- Provide clear loading, empty, validation, and API error states on every data page.
- Use responsive layouts from the start: mobile list-first, desktop split or table layouts where useful.

Core shared components:

```text
AppShell
PublicNav
DashboardNav
AdminSidebar
ManagerSidebar
AuthGuard
RoleGate
ApiError
EmptyState
FileUpload
ConfirmDialog
DataTable
PaginationControls
```

## Implementation Phases

### Phase 0: Planning And Inventory

Acceptance:

- Confirm the final new frontend folder name.
- Inventory all Angular screens and active API calls.
- Decide whether `/home` or `/` is the canonical home route.
- Document unresolved API mismatches before coding.

### Phase 1: Scaffold

Create the Next.js app with Tailwind and TypeScript.

Acceptance:

- App starts locally.
- Tailwind styles load.
- Environment variable `NEXT_PUBLIC_API_BASE_URL` is documented.
- Base layout and route groups exist.
- No backend behavior is changed.

### Phase 2: Shared Foundation

Build shared types, API client, auth state, route guards, layout, and reusable UI.

Acceptance:

- `ApiResponse<T>` is typed once.
- `401` handling clears local auth and routes to `/login`.
- Protected route groups block unauthenticated users.
- Shared form and file upload components are available.

### Phase 3: Public And Auth Flows

Implement home, login, register, logout, and current-user loading.

Acceptance:

- Signup preserves `/auth/signup` request/response behavior.
- Signin stores `authToken` and `userCurrent`.
- Invalid signin and duplicate signup show backend error messages.
- Refresh behavior is documented, even if not enabled in the first UI pass.

### Phase 4: User Profile And Projects

Implement profile create/update/list/detail and project list/create/update.

Acceptance:

- Profile multipart forms use backend-compatible field names.
- Contact fields are submitted in the shape expected by Quarkus profile service.
- Project APIs use documented `/project/user/**` routes.
- Profile detail shows projects and contact data.

### Phase 5: Jobs And Companies

Implement job browsing, job detail/apply, company list/detail, manager company profile, HR assignment, and job review.

Acceptance:

- Job apply/accept/reject query parameter names match the backend.
- Company create uses multipart field `image`.
- Manager and HR pages respect the current role values.
- Existing pending and accepted job flows are preserved.

### Phase 6: Admin And Notifications

Implement admin user/company management and notification list/update.

Acceptance:

- Admin screens can list, update active status, and delete users through `/auth/**`.
- Notifications can be listed and marked read/update.
- Company management preserves current manager endpoints.

### Phase 7: Parity QA

Run side-by-side checks against the Angular app and Quarkus backend.

Acceptance:

- Critical flows pass in browser:
  - signup
  - signin
  - profile create/update
  - project create/update/list
  - company create/update
  - job create/apply/accept/reject
  - notifications list/update
  - admin user list/update/delete
- Playwright covers at least auth, profile, job apply, and admin user flows.
- No route relies on hardcoded service ports except the configured gateway base URL.

## Testing Plan

Use:

- TypeScript checks for all frontend code.
- Unit tests for API helpers, auth helpers, and DTO mappers.
- Component tests for complex forms.
- Playwright for critical flows against a local backend.

Minimum test cases:

- API client unwraps successful `ApiResponse<T>`.
- API client surfaces backend `message` when `success=false`.
- `401` clears `authToken` and `userCurrent`.
- Multipart profile form sends `image`, profile fields, and contact fields.
- Multipart company form sends `image`.
- Job apply sends `jobDTO` and `idProfile` query params.

## Rollout Strategy

Run the Angular and Next.js clients side by side during migration:

```text
client/     Existing Angular client
frontend/   New Next.js client
```

Suggested local ports:

- Angular: `4200`
- Next.js: `3000`
- Gateway: `8080`

Do not remove Angular until the Next.js app passes parity QA and the user explicitly approves removal.

## Definition Of Done

The Next.js frontend migration is done when:

- Main Angular user, admin, manager, profile, project, job, company, and notification flows exist in Next.js.
- API calls use the Quarkus-compatible endpoint contract.
- Auth behavior matches current expectations.
- Tailwind UI is responsive and usable on mobile and desktop.
- Critical Playwright flows pass.
- Remaining backend/API mismatches are documented separately.
- `client/` is still available unless removal is explicitly requested.
